'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  console.log('Attempting login for:', data.email);

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error('Login error:', error.message);
    return { error: error.message };
  }

  console.log('Login successful, user:', authData.user?.id);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function createStore(name: string): Promise<{ data: { id: string; name: string } | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: 'You must be logged in to create a store' };
  }

  const adminClient = createAdminClient();

  const { data: newStore, error: storeError } = await adminClient
    .from('stores')
    .insert([{ name }])
    .select()
    .single();

  if (storeError) {
    return { data: null, error: storeError.message };
  }

  const { error: assignError } = await adminClient
    .from('user_stores')
    .insert([{ user_id: user.id, store_id: newStore.id }]);

  if (assignError) {
    await adminClient.from('stores').delete().eq('id', newStore.id);
    return { data: null, error: assignError.message };
  }

  return { data: newStore, error: null };
}
