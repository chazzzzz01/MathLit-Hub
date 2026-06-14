import { supabase } from '../lib/supabase';

export const userService = {
  // Get or create user
  async getOrCreateUser(userData) {
    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
     
    if (existingUser) {
      // Update last login or other info
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: userData.name,
          avatar_url: userData.picture,
          updated_at: new Date()
        })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return updatedUser;
    }
    
    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        id: userData.id || crypto.randomUUID(),
        google_id: userData.googleId,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.picture,
        role: null // Will be set when user selects role
      }])
      .select()
      .single();
    
    if (insertError) throw insertError;
    return newUser;
  },

  // Update user role
  async updateUserRole(userId, role) {
    const { data, error } = await supabase
      .from('users')
      .update({ role: role })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user by ID
  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
};