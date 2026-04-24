// src/components/AuthStatus.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthStatus() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Checking auth...</div>;

  return (
    <div style={{ padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '8px', margin: '10px' }}>
      <h4>Authentication Status</h4>
      {session ? (
        <div style={{ color: 'green' }}>
          ✅ Logged in as: {session.user.email}
          <br />
          User ID: {session.user.id}
        </div>
      ) : (
        <div style={{ color: 'red' }}>
          ❌ Not logged in
        </div>
      )}
    </div>
  );
}