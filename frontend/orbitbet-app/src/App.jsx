import React, { useState } from "react";
import OrbitBetPage from "./pages/OrbitBetPage";
import OrbitLoadingScreen from "./OrbitLoadingScreen"; 

function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  return (
    <div className="App">
      {!isAppReady ? (
        /* The onFinish prop tells the App when to switch from loading to the game */
        <OrbitLoadingScreen onFinish={() => setIsAppReady(true)} />
      ) : (
        <OrbitBetPage />
      )}
    </div>
  );
}

export default App;