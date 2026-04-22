'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = '/';
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh' 
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ 
          padding: '2.5rem', 
          width: '100%', 
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>SaveMoney</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Welcome back to your financial advisor</p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Email</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
          {message && <p style={{ color: '#10b981', fontSize: '0.85rem' }}>{message}</p>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Login
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 'var(--radius)',
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Sign Up
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
