import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export function TestSupabase() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      console.log('=== Testing Supabase Connection ===');
      console.log('Supabase client:', supabase);
      
      try {
        // Test 1: Try to fetch from leaderboard
        console.log('Attempting to fetch leaderboard...');
        const { data: leaderboard, error: fetchError } = await supabase
          .from('leaderboard')
          .select('*');
        
        if (fetchError) {
          console.error('Fetch error:', fetchError);
          setError(fetchError.message);
        } else {
          console.log('Leaderboard data:', leaderboard);
          setData(leaderboard || []);
        }
      } catch (err) {
        console.error('Connection error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    testConnection();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <p>Testing Supabase connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>❌ Connection Error</h2>
        <p>{error}</p>
        <details>
          <summary>Debug Info</summary>
          <pre>
            Supabase URL: {supabase.supabaseUrl}
            Supabase Key: {supabase.supabaseKey ? 'Set' : 'Not Set'}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>✅ Supabase Connected Successfully!</h2>
      <p>Found {data.length} players in leaderboard</p>
      
      <h3>Leaderboard Data:</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Username</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>XP</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map(player => (
            <tr key={player.email} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '8px' }}>{player.email}</td>
              <td style={{ padding: '8px' }}>{player.username}</td>
              <td style={{ padding: '8px' }}>{player.total_xp}</td>
              <td style={{ padding: '8px' }}>{player.total_scores}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}