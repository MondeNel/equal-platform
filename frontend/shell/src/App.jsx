import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("equal_token");
  if (!token) {
    window.location.href = "http://localhost:5171/login";
    return null;
  }
  return children;
}

function TokenFromURL() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("equal_token", token);
      // Clean URL by removing query param
      window.history.replaceState({}, document.title, "/");
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <TokenFromURL />
      <Routes>
        <Route path="/"      element={<PrivateRoute><LandingPage /></PrivateRoute>} />
        <Route path="/home"  element={<PrivateRoute><LandingPage /></PrivateRoute>} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}