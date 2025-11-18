/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_SERVICE_URL: string;
  readonly VITE_TRADING_SERVICE_URL: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
