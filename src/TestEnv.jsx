import React from 'react';

function TestEnv() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Variables Test</h1>
      <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Loaded' : '❌ Not Loaded'}</p>
      <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Not Loaded'}</p>
      <hr />
      <p>All VITE variables: {JSON.stringify(Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))}</p>
    </div>
  );
}

export default TestEnv;