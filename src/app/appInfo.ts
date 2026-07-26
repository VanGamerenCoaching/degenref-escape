export const APP_NAME = 'DegenRef Escape';
export const APP_VERSION = '0.1.0';

const environment = import.meta.env as { readonly VITE_REPOSITORY_URL?: string };

export const REPOSITORY_URL =
  environment.VITE_REPOSITORY_URL ??
  'https://github.com/vangamerencoaching/degenref-escape';
