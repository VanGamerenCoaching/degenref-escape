/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const appBase = resolveAppBase();

function resolveAppBase(): string {
  const explicitBase = process.env.VITE_BASE_PATH;

  if (explicitBase !== undefined && explicitBase.length > 0) {
    return normalizeBase(explicitBase);
  }

  const repositoryParts = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
  const repositoryName = repositoryParts.length >= 2 ? repositoryParts[1] : undefined;

  if (
    process.env.GITHUB_ACTIONS === 'true' &&
    typeof repositoryName === 'string' &&
    repositoryName.length > 0
  ) {
    return `/${repositoryName}/`;
  }

  return './';
}

function normalizeBase(base: string): string {
  if (base === './' || base === '/') {
    return base;
  }

  const baseWithLeadingSlash = base.startsWith('/') ? base : `/${base}`;

  return baseWithLeadingSlash.endsWith('/')
    ? baseWithLeadingSlash
    : `${baseWithLeadingSlash}/`;
}

export default defineConfig({
  base: appBase,
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
      registerType: 'prompt',
      manifest: {
        name: 'DegenRef Escape',
        short_name: 'DegenRef',
        description:
          'Niet-officiele leerapp voor degenschermarbitrage, lokaal en zonder backend.',
        lang: 'nl',
        theme_color: '#111317',
        background_color: '#111317',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'icons/degenref-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/degenref-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        maximumFileSizeToCacheInBytes: 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
