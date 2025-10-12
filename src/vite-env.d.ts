/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_WS_URL: string;
  readonly VITE_CALL_POLLING_INTERVAL: string;
  readonly VITE_MAX_FILE_SIZE_MB: string;
  readonly VITE_USE_MOCKS: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}