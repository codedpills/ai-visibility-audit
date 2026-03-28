import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

/**
 * Render the given URL to an HTML string for SSG pre-rendering.
 * Only routes that need static pre-rendering are included here.
 * Dynamic routes (/audits/:id/*) are not pre-rendered.
 */
export function render(url: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </MemoryRouter>
  );
}
