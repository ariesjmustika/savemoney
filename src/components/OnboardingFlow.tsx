'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

interface OnboardingFlowProps {
  user: any;
  profile: any;
}

export default function OnboardingFlow({ user, profile }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [salary, setSalary] = useState('');
  const supabase = createClient();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const completeOnboarding = async () => {
    setLoading(true);
    
    // 1. Create default wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert([{ name: 'Main Wallet', owner_id: user.id, balance: parseFloat(salary) || 0 }])
      .select()
      .maybeSingle();

    if (walletError) {
      console.error(walletError);
      setLoading(false);
      return;
    }

    // 2. Add wallet member (owner)
    await supabase
      .from('wallet_members')
      .insert([{ wallet_id: wallet.id, profile_id: user.id, role: 'owner' }]);

    // 3. Update profile status
    await supabase
      .from('profiles')
      .update({ has_completed_onboarding: true })
      .eq('id', user.id);

    setLoading(false);
    window.location.reload();
  };

  const steps = [
    {
      title: "Welcome to SaveMoney! 💸",
      description: "Let's set up your financial advisor in just a few steps. It will only take a minute.",
      content: (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '3rem' }}>👋</p>
        </div>
      )
    },
    {
      title: "Step 1: Your Initial Balance",
      description: "How much money do you currently have in your main account? This helps the AI give better advice.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Current Balance / Salary (IDR)</label>
          <input 
            type="number" 
            placeholder="e.g. 5000000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '1.2rem'
            }}
          />
        </div>
      )
    },
    {
      title: "Step 2: AI Recommendations",
      description: "Based on your income, SaveMoney AI will automatically suggest a budget split. You can see this later in your dashboard.",
      content: (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed var(--primary)' }}>
          <p style={{ fontStyle: 'italic', color: 'var(--primary)' }}>
            "I suggest putting 50% for needs, 30% for wants, and 20% for savings. For a 5M salary, that's 2.5M for essentials (Wifi, Rent, etc.)"
          </p>
        </div>
      )
    },
    {
      title: "Final Step: Invite your partner",
      description: "You can share this wallet with your wife later in the settings. Every transaction will show who made it!",
      content: (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--muted-foreground)' }}>
            Audit logging is enabled: you'll always know who spent what.
          </p>
          <div style={{ fontSize: '3rem', marginTop: '1rem' }}>👨‍👩‍👧</div>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh' 
    }}>
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="glass-card"
        style={{ 
          padding: '2.5rem', 
          width: '100%', 
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', position: 'absolute', top: '1.5rem', left: '2.5rem' }}>
          {steps.map((_, i) => (
            <div 
              key={i} 
              style={{ 
                width: '20px', 
                height: '4px', 
                borderRadius: '2px',
                background: i + 1 <= step ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.3s ease'
              }} 
            />
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>{currentStep.title}</h2>
          <p style={{ color: 'var(--muted-foreground)', lineHeight: '1.5' }}>{currentStep.description}</p>
        </div>

        <div>{currentStep.content}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button
            onClick={prevStep}
            disabled={step === 1 || loading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius)',
              background: 'transparent',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              visibility: step === 1 ? 'hidden' : 'visible',
              opacity: loading ? 0.5 : 1
            }}
          >
            Back
          </button>
          
          {step < steps.length ? (
            <button
              onClick={nextStep}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius)',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius)',
                background: '#10b981',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Setting up...' : 'Get Started!'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
