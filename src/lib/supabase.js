// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// For Vite, use import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL loaded:', supabaseUrl ? 'Yes' : 'No');
console.log('Supabase Key loaded:', supabaseAnonKey ? 'Yes' : 'No');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials! Check your .env file');
  console.error('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
} else {
  console.log('✅ Supabase credentials loaded successfully');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);