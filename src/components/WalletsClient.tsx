'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import WalletForm from '@/components/WalletForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalletsClient() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const fetchWallets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setWallets(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoinWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('wallet_members')
      .insert([{ wallet_id: joinId, profile_id: user.id, role: 'member' }]);

    if (error) {
      alert("Gagal bergabung: " + error.message);
    } else {
      alert("Berhasil bergabung ke dompet!");
      setJoinId('');
      fetchWallets();
    }
    setJoining(false);
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    alert("Wallet ID dikopi! Kirim ID ini ke istri Anda.");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '5rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>My Wallets</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Manage your shared and personal wallets.</p>
      </div>

      {/* Join Wallet Section */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Join a Wallet</h3>
        <form onSubmit={handleJoinWallet} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Paste Wallet ID here..."
            style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          />
          <button 
            disabled={joining || !joinId}
            type="submit"
            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {joining ? 'Joining...' : 'Join'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {wallets.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem' }}>No wallets found.</p>
        )}
        {wallets.map(wallet => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={wallet.id} 
            className="glass-card" 
            style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>{wallet.name}</h3>
                <button 
                  onClick={() => copyToClipboard(wallet.id)}
                  style={{ fontSize: '0.7rem', background: 'var(--muted)', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem', color: 'var(--muted-foreground)' }}
                >
                  📋 Copy ID for Wife
                </button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                  {formatCurrency(wallet.balance)}
                </h2>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="glass-card" 
        style={{ 
          padding: '1rem', 
          border: '1px dashed var(--primary)', 
          background: 'transparent', 
          cursor: 'pointer', 
          color: 'var(--primary)', 
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        + Create New Wallet
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <WalletForm 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchWallets} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
