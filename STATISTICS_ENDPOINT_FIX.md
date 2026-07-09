# GET /api/statistics — Root Cause & Fix

## Summary
The `GET /api/statistics` endpoint was failing to start/respond because the backend server could not boot. The endpoint itself was correctly implemented and registered; the failure was caused by the server process crashing on startup before it could ever serve any request.

## Root Cause
The backend server (`backend/server/index.js`) failed to load environment variables from `backend/.env`.

- `backend/package.json` declares `"type": "module"`, so `index.js` runs as an ES module.
- The original code used `dotenv.config({ path: ".env" })`, which resolves the `.env` path **relative to the current working directory** of the process, not the file location.
- When the server was launched from the project root (`node backend/server/index.js`), the CWD was `c:\Users\lenovo\Downloads\Website`, so dotenv looked for `c:\Users\lenovo\Downloads\Website\.env` (which does not exist). The real file is `backend/.env`.
- With no env loaded, `validateEnvironment()` reported all required variables (MONGO_URI, JWT_SECRET, etc.) as missing and the process exited with code 1 before the HTTP server started.
- As a result, `GET /api/statistics` (and every other route) returned connection-refused / no response.

## Fix Applied
File changed: `backend/server/index.js`

1. Added ES-module-safe path resolution:
   ```js
   import { fileURLToPath } from "url";
   import path from "path";
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   ```
2. Pointed dotenv at the correct, location-relative file:
   ```js
   dotenv.config({ path: path.resolve(__dirname, "../.env") });
   ```
   This resolves to `backend/.env` regardless of the directory the process is started from.

No changes were required to the statistics route, controller, or service — they were already correct.

## Verification
1. Restarted backend: `node backend/server/index.js` → server booted successfully, "🚀 Server running on http://localhost:5000", MongoDB connected.
2. Tested endpoint: `curl -s -o nul -w "%{http_code}" http://localhost:5000/api/statistics`
3. Result: **HTTP 200** ✅
   Server log confirms: `GET /api/statistics` served successfully.

## Files Changed
- `backend/server/index.js` — fixed `.env` loading path (root cause of the outage).