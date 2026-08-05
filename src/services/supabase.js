import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = 
  Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'sua-url-do-supabase' && supabaseAnonKey !== 'sua-chave-anon-do-supabase');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase não configurado corretamente. A aplicação precisa de VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY válidos.'
  );
}
