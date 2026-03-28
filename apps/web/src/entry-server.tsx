import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';

/**
 * Render the given URL to an HTML string for SSG pre-rendering.
 * Only the homepage needs static pre-rendering; dynamic routes are skipped.
 * AuthProvider is included so the tree renders without missing-context errors;
 * in the SSR environment getMe() returns null (no cookies), so user === null.
 */
export function render(url: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}
