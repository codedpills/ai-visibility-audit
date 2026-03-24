import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AuditProgressPage } from './pages/AuditProgressPage';
import { AuditResultsPage } from './pages/AuditResultsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/audits/:id/progress" element={<AuditProgressPage />} />
        <Route path="/audits/:id/results" element={<AuditResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
