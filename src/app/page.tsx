import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingFlow from '@/components/OnboardingFlow';
import DashboardClient from '@/components/DashboardClient';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile to check onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // If no profile, create one (this can happen on first sign up)
  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert([{ id: user.id, full_name: user.email?.split('@')[0] }])
      .select()
      .maybeSingle();
      
    if (newProfile) {
      return <OnboardingFlow user={user} profile={newProfile} />;
    }
  }

  if (profile && !profile.has_completed_onboarding) {
    return <OnboardingFlow user={user} profile={profile} />;
  }

  return <DashboardClient initialProfile={profile} />;
}
