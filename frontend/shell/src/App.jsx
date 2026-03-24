import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import BottomNav from "./components/BottomNav";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#05050e", display: "flex", flexDirection: "column" }}>
    
        {/* Main content */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Bottom Nav always visible */}
        <BottomNav active="home" />
      </div>
    </BrowserRouter>
  );
}