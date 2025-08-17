// src/api/apiClient.ts
// Single source of truth: re-export the configured axios instance from index.ts to avoid duplicated clients and circular imports.
export { default } from './index';