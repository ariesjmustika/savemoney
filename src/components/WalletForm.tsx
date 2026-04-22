'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';

interface WalletFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function WalletForm({ onClose, onSuccess }: WalletFormProps) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Create wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert([{ name, owner_id: user.id, balance: parseFloat(balance) || 0 }])
      .select()
      .single();

    if (walletError) {
      alert(walletError.message);
      setLoading(false);
      return;
    }

    // 2. Add owner as member
    await supabase
      .from('wallet_members')
      .insert([{ wallet_id: wallet.id, profile_id: user.id, role: 'owner' }]);

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Create New Wallet</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Wallet Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Personal Savings"
              style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Initial Balance (IDR)</label>
            <input 
              required
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            style={{
              padding: '1rem', borderRadius: 'var(--radius)', background: 'var(--primary)',
              color: 'var(--primary-foreground)', border: 'none', fontWeight: 'bold', cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating...' : 'Create Wallet'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
