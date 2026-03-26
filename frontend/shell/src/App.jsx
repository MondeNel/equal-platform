import React, { Suspense } from 'react';
// Lazy load the remote MFE
const OrbitGame = React.lazy(() => import('orbitbet_app/OrbitGame'));

function App() {
  return (
    <div className="platform-container">
      <h1>Equal Adventure Platform</h1>
      <Suspense fallback={<div>Loading OrbitBet...</div>}>
        <OrbitGame userId="user-uuid-from-auth" />
      </Suspense>
    </div>
  );
}