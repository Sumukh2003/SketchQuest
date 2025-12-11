/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  // add more env variables as needed
  // readonly VITE_API_KEY: string;
  // readonly VITE_ANOTHER_VAR: string;
}
