'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAdvisor() {
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getEvaluation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/evaluate', { method: 'POST' });
      const data = await res.json();
      if (data.summary) {
        setEvaluation(data);
      } else {
        alert(data.message || data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span> AI Financial Advisor
        </h3>
        {!evaluation && (
          <button 
            onClick={getEvaluation}
            disabled={loading}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius)', 
              background: 'var(--primary)', 
              color: 'var(--primary-foreground)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze My Spending'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {evaluation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ padding: '1rem', borderRadius: 'var(--radius)', background: 'var(--background)' }}>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{evaluation.summary}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                background: 'var(--primary)', display: 'flex', 
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'white'
              }}>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>Score</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{evaluation.score}/10</span>
              </div>
              <ul style={{ flex: 1, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                {evaluation.recommendations?.map((r: string, i: number) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{r}</li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => setEvaluation(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', alignSelf: 'center' }}
            >
              Close Analysis
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!evaluation && !loading && (
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
          Click the button above to get a personalized analysis of your spending habits this month.
        </p>
      )}
    </div>
  );
}
