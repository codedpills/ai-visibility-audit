import { describe, it, expect } from 'vitest';
import { extractSchemaOrg } from './index.js';

const wrap = (json: string) =>
  `<html><head><script type="application/ld+json">${json}</script></head></html>`;

describe('extractSchemaOrg', () => {
  it('returns empty array for HTML with no JSON-LD', () => {
    expect(
      extractSchemaOrg('<html><body>no schema here</body></html>')
    ).toEqual([]);
  });

  it('extracts a single JSON-LD object from a full HTML document', () => {
    const html = wrap(
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Acme',
      })
    );
    const result = extractSchemaOrg(html);
    expect(result).toHaveLength(1);
    expect(result[0]['@type']).toBe('Organization');
  });

  it('extracts a JSON-LD array and flattens it', () => {
    const html = wrap(
      JSON.stringify([{ '@type': 'FAQPage' }, { '@type': 'HowTo' }])
    );
    const result = extractSchemaOrg(html);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s['@type'])).toEqual(
      expect.arrayContaining(['FAQPage', 'HowTo'])
    );
  });

  it('extracts multiple separate JSON-LD script tags', () => {
    const html = `<html><head>
      <script type="application/ld+json">${JSON.stringify({ '@type': 'Organization' })}</script>
      <script type="application/ld+json">${JSON.stringify({ '@type': 'FAQPage' })}</script>
    </head></html>`;
    const result = extractSchemaOrg(html);
    expect(result).toHaveLength(2);
  });

  it('skips malformed JSON-LD and returns remaining valid schemas', () => {
    const html = `<html><head>
      <script type="application/ld+json">{ not valid json }</script>
      <script type="application/ld+json">${JSON.stringify({ '@type': 'HowTo' })}</script>
    </head></html>`;
    const result = extractSchemaOrg(html);
    expect(result).toHaveLength(1);
    expect(result[0]['@type']).toBe('HowTo');
  });

  it('returns empty array when HTML is cleaned body content (no script tags)', () => {
    // This simulates what Firecrawl returns for doc.html (stripped) vs doc.rawHtml (full)
    const cleanedHtml = '<main><h1>Hello</h1><p>Content here</p></main>';
    expect(extractSchemaOrg(cleanedHtml)).toEqual([]);
  });
});
