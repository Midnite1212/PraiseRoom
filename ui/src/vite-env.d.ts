/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_MAIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
