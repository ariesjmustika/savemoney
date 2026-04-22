'use server';

import { createClient } from '@/utils/supabase/server';
import { sendTelegramMessage } from '@/utils/telegram';
import { revalidatePath } from 'next/cache';

export async function createTransactionAction(formData: {
  wallet_id: string;
  category_id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  receipt_image_url: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 1. Insert transaction
  const { data, error } = await supabase.from('transactions').insert([
    {
      ...formData,
      created_by: user.id
    }
  ]).select('*, categories(name)').maybeSingle();

  if (error) throw error;

  // 2. Update wallet balance
  const multiplier = formData.type === 'income' ? 1 : -1;
  const { data: wallet } = await supabase.from('wallets').select('balance, name').eq('id', formData.wallet_id).maybeSingle();
  
  if (wallet) {
    const newBalance = parseFloat(wallet.balance) + (formData.amount * multiplier);
    await supabase.from('wallets').update({ balance: newBalance }).eq('id', formData.wallet_id);

    // 3. Send Telegram Notification
    const emoji = formData.type === 'income' ? '💰' : '💸';
    const amountStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(formData.amount);
    const balanceStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(newBalance);
    
    const message = `
<b>${emoji} New Transaction</b>
-------------------------
<b>Type:</b> ${formData.type.toUpperCase()}
<b>Category:</b> ${data.categories?.name || 'N/A'}
<b>Amount:</b> ${amountStr}
<b>Desc:</b> ${formData.description || '-'}
<b>Wallet:</b> ${wallet.name}
-------------------------
<b>New Balance:</b> ${balanceStr}
    `;

    await sendTelegramMessage(message);
  }

  revalidatePath('/');
  return { success: true };
}
