import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
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
})
