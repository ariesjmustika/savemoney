'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import TransactionForm from '@/components/TransactionForm';
import AIAdvisor from '@/components/AIAdvisor';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardClient({ initialProfile }: { initialProfile: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch ALL wallets where user is owner or member
    const { data: walletsData } = await supabase
      .from('wallets')
      .select('*');
    
    if (walletsData && walletsData.length > 0) {
      // Calculate total balance
      const totalBalance = walletsData.reduce((acc, w) => acc + parseFloat(w.balance), 0);
      setWallet({ balance: totalBalance }); // Use a virtual "total" wallet for the summary
      
      const walletIds = walletsData.map(w => w.id);

      // 2. Fetch recent transactions for ALL these wallets
      const { data: transData } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name, icon),
          profiles:created_by (full_name),
          wallets:wallet_id (name)
        `)
        .in('wallet_id', walletIds)
        .order('transaction_date', { ascending: false })
        .limit(20);
        
      if (transData) setTransactions(transData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Card */}
      <div className="glass-card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Hello, <span style={{ color: 'var(--primary)' }}>{initialProfile?.full_name}</span>!
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Your financial health looks {wallet?.balance > 0 ? 'good' : 'a bit low'}.
          </p>
        </div>
        <div style={{ 
          position: 'absolute', top: '-20px', right: '-20px', 
          width: '100px', height: '100px', background: 'var(--primary)', 
          borderRadius: '50%', filter: 'blur(60px)', opacity: 0.2 
        }} />
      </div>

      {/* AI Advisor */}
      <AIAdvisor />

      {/* Balance Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: '600', textTransform: 'uppercase' }}>Current Balance</p>
          <h2 style={{ fontSize: '2.2rem', marginTop: '0.5rem', fontWeight: '800' }}>
            {wallet ? formatCurrency(wallet.balance) : '...'}
          </h2>
        </div>
      </div>

      {/* Add Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="glass-card"
        style={{ 
          padding: '1.25rem', 
          borderRadius: 'var(--radius)', 
          background: 'var(--primary)', 
          color: 'var(--primary-foreground)',
          border: 'none',
          fontWeight: '800',
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: '0 10px 20px -10px var(--primary)',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        + Add Transaction
      </button>

      {/* Transactions List */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Recent Transactions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {transactions.length === 0 && !loading && (
            <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem' }}>No transactions yet. Start by adding one!</p>
          )}
          {transactions.map((t) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={t.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ 
                  width: '45px', height: '45px', borderRadius: '12px', 
                  background: 'var(--muted)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' 
                }}>
                  {t.categories?.icon || '💸'}
                </div>
                <div>
                  <p style={{ fontWeight: '600' }}>{t.description || t.categories?.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                    {new Date(t.transaction_date).toLocaleDateString()} • {t.wallets?.name} • by {t.profiles?.full_name}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ 
                  fontWeight: '800', 
                  color: t.type === 'income' ? '#10b981' : 'var(--foreground)' 
                }}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </p>
                {t.receipt_image_url && (
                  <a href={t.receipt_image_url} target="_blank" style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'underline' }}>View Receipt</a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <TransactionForm 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchData} 
          />
        )}
      </AnimatePresence>

      <form action="/auth/signout" method="post" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button 
          type="submit"
          style={{ 
            background: 'transparent',
            color: 'var(--muted-foreground)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Sign Out from SaveMoney
        </button>
      </form>
    </div>
  );
}
