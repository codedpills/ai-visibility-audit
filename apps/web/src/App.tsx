import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { AuditProgressPage } from './pages/AuditProgressPage';
import { AuditResultsPage } from './pages/AuditResultsPage';
import { LoginPage } from './pages/LoginPage';
import { MagicLinkVerifyPage } from './pages/MagicLinkVerifyPage';
import { MyAuditsPage } from './pages/MyAuditsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/audits/:id/progress" element={<AuditProgressPage />} />
          <Route path="/audits/:id/results" element={<AuditResultsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
          <Route path="/my-audits" element={<MyAuditsPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
