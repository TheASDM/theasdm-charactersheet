# Frontend Upgrade Instructions - React Scripts to Vite Migration

## Current Situation

- Project is fully scaffolded at `/Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet/`
- Backend (Node.js/Express/Prisma) and Discord bot build successfully
- Frontend has dependency conflicts with Node.js v22 and react-scripts 5.0.1
- All dependencies installed with `--legacy-peer-deps` workaround

## Goal: Migrate Frontend from React Scripts to Vite

### Why Vite?

- Modern build tool with faster development
- Better TypeScript support
- No dependency conflicts with Node.js v22
- Smaller bundle sizes and faster builds
- Better developer experience

## Step-by-Step Migration Plan

### Phase 1: Backup and Prepare

```bash
cd /Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet/frontend
# Backup current frontend
cp -r . ../frontend-backup
```

### Phase 2: Create New Vite Project

```bash
# Create temporary Vite project for reference
cd /Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet/
npx create-vite@latest temp-vite-frontend --template react-ts
```

### Phase 3: Migration Checklist

#### Files to Copy from temp-vite-frontend to frontend/:

- [ ] `vite.config.ts` (replace webpack config)
- [ ] Update `package.json` scripts and dependencies
- [ ] `index.html` (move from public/ to root and update)
- [ ] Update `tsconfig.json` for Vite compatibility

#### Files to Update in Current Frontend:

- [ ] `src/main.tsx` (rename from index.tsx, update ReactDOM.render)
- [ ] Update all imports to use explicit file extensions where needed
- [ ] Update environment variable usage (REACT*APP* → VITE\_)
- [ ] Update PWA configuration for Vite

#### Dependencies to Update:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.1.0",
    "vite": "^4.4.5",
    "vite-plugin-pwa": "^0.16.5"
  }
}
```

### Phase 4: Configuration Updates

#### New vite.config.ts:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'D&D Character Sheet Generator',
        short_name: 'D&D CharSheet',
        description: 'D&D 2024 Character Sheet Generator with Nimble TTRPG',
        theme_color: '#8B5A2B',
        background_color: '#1a1a1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### Phase 5: File Structure Changes

- [ ] Move `public/index.html` to root `index.html`
- [ ] Update `src/index.tsx` → `src/main.tsx`
- [ ] Remove `public/manifest.json` (handled by Vite PWA)
- [ ] Update asset imports to use Vite conventions

### Phase 6: Environment Variables

- [ ] Rename `.env` variables from `REACT_APP_*` to `VITE_*`
- [ ] Update all `process.env.REACT_APP_*` to `import.meta.env.VITE_*`

### Phase 7: Testing

```bash
cd frontend
npm run dev    # Test development server
npm run build  # Test production build
npm run preview # Test production preview
```

## Current Frontend Structure to Preserve

The following components and structure should be maintained:

- `/src/components/` - All React components
- `/src/styles/` - GlobalStyles.tsx and styled-components
- `/src/services/` - API service layers
- `/src/types/` - TypeScript type definitions
- `/src/utils/` - Utility functions
- `/src/hooks/` - Custom React hooks
- PWA functionality (service worker, manifest)

## Dependencies Currently Installed

The frontend currently has these key packages that should work with Vite:

- React 18.2.0
- TypeScript 5.2.2
- styled-components 6.1.1
- react-router-dom 6.17.0
- axios 1.6.0
- socket.io-client 4.7.5

## Post-Migration Cleanup

```bash
# Remove old react-scripts dependencies
npm uninstall react-scripts
# Remove backup after successful migration
rm -rf ../frontend-backup ../temp-vite-frontend
```

## Expected Benefits After Migration

- No more `--legacy-peer-deps` needed
- Faster development builds (sub-second HMR)
- Better TypeScript integration
- Modern JavaScript features without polyfills
- Smaller production bundles
- Native ES modules support

## Rollback Plan

If migration fails:

```bash
cd /Users/dustinamodeo/Documents/coding/projects/theasdm-charactersheet/
rm -rf frontend
mv frontend-backup frontend
# Continue with Node.js downgrade option instead
```
