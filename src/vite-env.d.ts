/// <reference types="vite/client" />

declare const isStaticBuild: boolean;
declare const __ENVIRONMENT__: string;

interface ImportMetaEnv {
  readonly VITE_WISP_URL?: string;
}
