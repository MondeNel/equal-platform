import { useEffect, useState } from "react";

export function useOrbitAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("equal_token", urlToken);
      // Clean URL after saving token
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const storedUser = localStorage.getItem("equal_user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return { user, currency: user?.currency_symbol || "R" };
}