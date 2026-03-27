import { webcrypto } from 'node:crypto';

// Polyfill Web Crypto API for jose and other packages that use globalThis.crypto
// Required in Node 18 where globalThis.crypto may not be populated in all environments.
if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  });
}
