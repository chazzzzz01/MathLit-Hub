// src/components/AuthDebug.jsx
import { useEffect, useState } from 'react';
import { supabase, checkAuth, getCurrentUser } from '../lib/supabase';

export default function AuthDebug() {
  const [authStatus, setAuthStatus] = useState(null);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const session = await checkAuth();
      const user = await getCurrentUser();
      setSession(session);
      setUser(user);
      setAuthStatus(!!session);
    };
    
    checkAuthStatus();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      setSession(session);
      setUser(session?.user || null);
      setAuthStatus(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', margin: '20px' }}>
      <h3>Authentication Debug Info</h3>
      <p><strong>Authenticated:</strong> {authStatus ? '✅ Yes' : '❌ No'}</p>
      {user && (
        <>
          <p><strong>User Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</p>
        </>
      )}
      {session && (
        <>
          <p><strong>Access Token:</strong> {session.access_token?.substring(0, 20)}...</p>
          <p><strong>Expires At:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
        </>
      )}
      <button 
        onClick={async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('Sign out error:', error);
          } else {
            console.log('Signed out');
            window.location.reload();
          }
        }}
        style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Sign Out
      </button>
    </div>
  );
}