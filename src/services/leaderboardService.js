// src/services/leaderboardService.js
import { supabase } from '../lib/supabase';

export const leaderboardService = {
  // Get leaderboard (top 100 players)
  async getLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('email, username, total_xp, total_scores, last_updated')
        .order('total_xp', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      console.log('📊 Fetched leaderboard from Supabase:', data?.length || 0, 'players');
      console.log('📊 Sample leaderboard data:', data?.slice(0, 3));
      
      // Transform to match your component's expected format
      return data.map(player => ({
        email: player.email,
        username: player.username || player.email?.split('@')[0],
        totalXP: player.total_xp || 0,
        totalScores: player.total_scores || 0,
        lastUpdated: player.last_updated
      }));
    } catch (error) {
      console.error('❌ Error fetching leaderboard from Supabase:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('global_leaderboard');
      return saved ? JSON.parse(saved) : [];
    }
  },

  // Update or insert user's leaderboard entry
  async updateLeaderboard(userEmail, username, totalXP, totalScores) {
    // Validate inputs
    if (!userEmail || userEmail === 'guest' || userEmail.includes('test')) {
      console.error('❌ Cannot update leaderboard: Invalid email');
      return null;
    }

    // Ensure username is provided
    let finalUsername = username;
    if (!finalUsername || finalUsername === 'undefined' || finalUsername === 'null') {
      finalUsername = userEmail.split('@')[0];
      console.log(`⚠️ No username provided, using email prefix: ${finalUsername}`);
    }

    console.log('🔄 Updating leaderboard:', {
      email: userEmail,
      username: finalUsername,
      totalXP: totalXP || 0,
      totalScores: totalScores || 0
    });

    try {
      // First, check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('leaderboard')
        .select('email, username, total_xp, total_scores')
        .eq('email', userEmail)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error checking existing user:', fetchError);
      }
      
      let result;
      
      if (existingUser) {
        // Update existing user - only update if new XP is higher
        const newXP = Math.max(existingUser.total_xp || 0, totalXP || 0);
        const newScores = Math.max(existingUser.total_scores || 0, totalScores || 0);
        
        console.log(`📝 Updating existing user: Old XP: ${existingUser.total_xp}, New XP: ${newXP}`);
        
        const { data, error } = await supabase
          .from('leaderboard')
          .update({
            username: finalUsername,
            total_xp: newXP,
            total_scores: newScores,
            last_updated: new Date().toISOString()
          })
          .eq('email', userEmail)
          .select();
        
        if (error) throw error;
        result = data;
        console.log('✅ Existing user updated in Supabase');
      } else {
        // Insert new user
        console.log('➕ Inserting new user:', userEmail);
        const { data, error } = await supabase
          .from('leaderboard')
          .insert({
            email: userEmail,
            username: finalUsername,
            total_xp: totalXP || 0,
            total_scores: totalScores || 0,
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
          .select();
        
        if (error) throw error;
        result = data;
        console.log('✅ New user inserted into Supabase');
      }
      
      console.log('✅ Leaderboard update successful:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error updating leaderboard in Supabase:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Fallback to localStorage
      console.log('💾 Falling back to localStorage');
      this.updateLeaderboardLocal(userEmail, finalUsername, totalXP, totalScores);
      return null;
    }
  },

  // Force update leaderboard with latest XP (for real-time updates)
  async forceUpdateLeaderboard(userEmail, username, totalXP, totalScores) {
    if (!userEmail || userEmail === 'guest') return null;
    
    try {
      console.log('⚡ Force updating leaderboard with latest XP:', { totalXP, totalScores });
      
      const { data, error } = await supabase
        .from('leaderboard')
        .upsert({
          email: userEmail,
          username: username || userEmail.split('@')[0],
          total_xp: totalXP,
          total_scores: totalScores,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'email'
        })
        .select();
      
      if (error) throw error;
      
      console.log('✅ Force update successful:', data);
      return data;
    } catch (error) {
      console.error('❌ Error force updating leaderboard:', error);
      this.updateLeaderboardLocal(userEmail, username, totalXP, totalScores);
      return null;
    }
  },

  // Get user's achievements
  async getUserAchievements(email) {
    if (!email) {
      console.error('❌ Cannot get achievements: No email provided');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievements')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      
      const achievements = data?.achievements || [];
      console.log(`📊 Fetched ${achievements.length} achievements for ${email}`);
      return achievements;
    } catch (error) {
      console.error('❌ Error fetching achievements from Supabase:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem(`achievements_${email}`);
      return saved ? JSON.parse(saved) : [];
    }
  },

  // Update user's achievements
  async updateUserAchievements(email, achievements) {
    if (!email) {
      console.error('❌ Cannot update achievements: No email provided');
      return null;
    }

    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_achievements')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing achievements:', fetchError);
      }
      
      let result;
      
      if (existingUser) {
        // Update existing
        const { data, error } = await supabase
          .from('user_achievements')
          .update({
            achievements: achievements,
            updated_at: new Date().toISOString()
          })
          .eq('email', email)
          .select();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_achievements')
          .insert({
            email: email,
            achievements: achievements,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
          .select();
        
        if (error) throw error;
        result = data;
      }
      
      console.log('✅ Achievements updated in Supabase for:', email);
      return result;
    } catch (error) {
      console.error('❌ Error updating achievements in Supabase:', error);
      // Fallback to localStorage
      localStorage.setItem(`achievements_${email}`, JSON.stringify(achievements));
      return null;
    }
  },

  // Fallback: Update localStorage
  updateLeaderboardLocal(userEmail, username, totalXP, totalScores) {
    console.log('💾 Saving to localStorage fallback');
    let leaderboard = [];
    const saved = localStorage.getItem('global_leaderboard');
    if (saved) leaderboard = JSON.parse(saved);
    
    const finalUsername = username || userEmail.split('@')[0];
    
    const index = leaderboard.findIndex(entry => entry.email === userEmail);
    const userEntry = {
      email: userEmail,
      username: finalUsername,
      totalXP: totalXP || 0,
      totalScores: totalScores || 0,
      lastUpdated: new Date().toISOString()
    };
    
    if (index !== -1) {
      leaderboard[index] = userEntry;
    } else {
      leaderboard.push(userEntry);
    }
    
    leaderboard.sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0));
    localStorage.setItem('global_leaderboard', JSON.stringify(leaderboard));
    console.log('💾 Saved to localStorage, leaderboard size:', leaderboard.length);
  }
};