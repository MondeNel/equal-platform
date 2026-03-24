import { useEffect, useState } from 'react';
import BetPage from './pages/BetPage';
import BottomNav from "../../shell/src/components/BottomNav";

/**
 * Extract token + tab from URL and persist globally
 */
function TokenFromURL() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const tab = params.get("tab");

    if (token) {
      localStorage.setItem("equal_token", token);
    }

    if (tab) {
      localStorage.setItem("active_tab", tab);
    }

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  return null;
}

/**
 * Get active tab from shared state
 */
function useActiveTab() {
  const [tab, setTab] = useState("bet");

  useEffect(() => {
    const stored = localStorage.getItem("active_tab");
    if (stored) setTab(stored);
  }, []);

  return tab;
}

export default function App() {
  const activeTab = useActiveTab();

  return (
    <>
      <TokenFromURL />
      <BetPage />
      <BottomNav active={activeTab} />
    </>
  );
}