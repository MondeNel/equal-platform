import { useEffect } from 'react';
import BetPage from './pages/BetPage';

function TokenFromURL() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("equal_token", token);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <TokenFromURL />
      <BetPage />
    </>
  );
}
