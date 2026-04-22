'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';
import { createTransactionAction } from '@/app/actions/transactions';

interface TransactionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({ onClose, onSuccess }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [walletId, setWalletId] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: catData } = await supabase.from('categories').select('*').eq('type', type);
      const { data: walData } = await supabase.from('wallets').select('*');
      
      if (catData) setCategories(catData);
      if (walData) {
        setWallets(walData);
        if (walData.length > 0) setWalletId(walData[0].id);
      }
    }
    fetchData();
  }, [type, supabase]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Compression
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      setLoading(true);
      const compressedFile = await imageCompression(file, options);
      setImage(compressedFile);
    } catch (error) {
      console.error('Compression error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let imageUrl = null;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, image);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      }

      await createTransactionAction({
        wallet_id: walletId,
        category_id: categoryId,
        amount: parseFloat(amount),
        description,
        type,
        receipt_image_url: imageUrl,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '2rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Add Transaction</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--foreground)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--muted)', padding: '0.25rem', borderRadius: 'var(--radius)' }}>
            <button 
              type="button"
              onClick={() => setType('expense')}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: 'calc(var(--radius) - 4px)',
                background: type === 'expense' ? 'var(--background)' : 'transparent',
                color: type === 'expense' ? '#ef4444' : 'var(--muted-foreground)',
                border: 'none', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Expense
            </button>
            <button 
              type="button"
              onClick={() => setType('income')}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: 'calc(var(--radius) - 4px)',
                background: type === 'income' ? 'var(--background)' : 'transparent',
                color: type === 'income' ? '#10b981' : 'var(--muted-foreground)',
                border: 'none', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Income
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Wallet</label>
            <select 
              required
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem' }}
            >
              <option value="">Select Wallet</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name} (Balance: {new Intl.NumberFormat('id-ID').format(w.balance)})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Amount (IDR)</label>
            <input 
              required
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1.1rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Category</label>
            <select 
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Receipt Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              style={{ fontSize: '0.8rem' }}
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius)', marginTop: '0.5rem' }} />
            )}
          </div>

          <button 
            disabled={loading}
            type="submit"
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius)',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '1rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : 'Save Transaction'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
