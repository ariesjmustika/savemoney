import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = [
    { name: 'Gaji', icon: '💰', type: 'income' },
    { name: 'Bonus', icon: '🎁', type: 'income' },
    { name: 'Investasi', icon: '📈', type: 'income' },
    { name: 'Makanan', icon: '🍔', type: 'expense' },
    { name: 'Transportasi', icon: '🚗', type: 'expense' },
    { name: 'Belanja', icon: '🛍️', type: 'expense' },
    { name: 'Kesehatan', icon: '🏥', type: 'expense' },
    { name: 'Pendidikan', icon: '🎓', type: 'expense' },
    { name: 'Hiburan', icon: '🎮', type: 'expense' },
    { name: 'Tagihan', icon: '🧾', type: 'expense' },
    { name: 'Cicilan', icon: '🏠', type: 'expense' },
    { name: 'Bayi/Anak', icon: '🍼', type: 'expense' },
    { name: 'Wifi/Pulsa', icon: '📶', type: 'expense' }
  ];

  try {
    const { error } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'name, type' });

    if (error) throw error;

    return NextResponse.redirect(new URL('/profile', req.url), { status: 303 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
