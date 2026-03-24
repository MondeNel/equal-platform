import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("equal_token");
  if (!token) {
    window.location.href = "http://localhost:5171/login";
    return null;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<PrivateRoute><LandingPage /></PrivateRoute>} />
        <Route path="/home"  element={<PrivateRoute><LandingPage /></PrivateRoute>} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}