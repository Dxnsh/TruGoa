import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')

  // Fail the production build rather than shipping a bundle with no API base.
  // A missing variable used to fall back to localhost, which builds and deploys
  // perfectly happily and then breaks every page for every visitor. Failing here
  // means the deploy stops with a message instead.
  if (command === 'build' && !env.VITE_API_BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL is not set — refusing to build. Set it in the Vercel ' +
        'project environment (Production and Preview), or in frontend/.env for a ' +
        'local build. See .env.example.'
    )
  }

  return {
    plugins: [react()],
    server: {
      // Both the backend CORS allowlist and the Google OAuth client's authorised
      // JavaScript origins are registered against localhost:5173 exactly. Vite's
      // default behaviour is to silently move to 5174/5175 when the port is busy,
      // which breaks API calls with CORS errors and Google sign-in with
      // "Error 400: origin_mismatch". strictPort makes it fail loudly instead, so
      // the real problem (a stale process holding 5173) is obvious immediately.
      port: 5173,
      strictPort: true,
    },
  }
})
