import { supabase } from './lib/supabase';

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to fetch from users table
    const { data, error } = await supabase
      .from('users')
      .select('count');
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('Supabase test failed:', error);
    return false;
  }
}