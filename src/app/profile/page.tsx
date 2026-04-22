import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', 
          background: 'var(--primary)', margin: '0 auto 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', color: 'white'
        }}>
          {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>
        <h1 style={{ fontSize: '1.5rem' }}>{profile?.full_name || 'User'}</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>{user.email}</p>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <span>Notification Settings</span>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Telegram Connected</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <span>Account Type</span>
          <span style={{ color: 'var(--muted-foreground)' }}>Free Tier</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Database Setup</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>If your categories are empty, click below to populate them with default values.</p>
        <form action="/api/db/seed" method="post">
          <button 
            type="submit"
            style={{ 
              width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)',
              background: 'var(--primary)', color: 'white', border: 'none',
              fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            Seed Default Categories
          </button>
        </form>
      </div>

      <form action="/auth/signout" method="post" style={{ textAlign: 'center' }}>
        <button 
          type="submit"
          className="glass-card"
          style={{ 
            width: '100%',
            padding: '1rem',
            background: 'transparent',
            color: '#ef4444',
            border: '1px solid #ef4444',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
