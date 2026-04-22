'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Home', path: '/', icon: '🏠' },
  { name: 'Wallets', path: '/wallets', icon: '👛' },
  { name: 'AI Advice', path: '/ai-advisor', icon: '🤖' },
  { name: 'Profile', path: '/profile', icon: '👤' },
];

export default function Navigation() {
  const pathname = usePathname();

  // Don't show nav on login page
  if (pathname === '/login') return null;

  return (
    <nav 
      className="glass-card" 
      style={{ 
        position: 'fixed', 
        bottom: '1.5rem', 
        left: '1rem', 
        right: '1rem', 
        zIndex: 50, 
        padding: '0.75rem',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link key={item.path} href={item.path} style={{ position: 'relative' }}>
            <motion.div
              whileTap={{ scale: 0.9 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                transition: 'color 0.3s ease',
                fontSize: '0.75rem',
                fontWeight: isActive ? '700' : '500'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
              <span>{item.name}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  style={{ 
                    position: 'absolute', 
                    bottom: '-10px', 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    background: 'var(--primary)' 
                  }} 
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
