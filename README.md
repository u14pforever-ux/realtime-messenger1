# Realtime Messenger (Simple)

This is a simple real-time chat app (Option A) using Socket.IO (Node.js) and React (Vite).

Structure:
- server/  (Node + Socket.IO)
- client/  (React + Vite)

## Quick local run (requires Node.js & npm)
1. Start server:
   ```
   cd server
   npm install
   npm start
   ```
2. Start client (in a separate terminal):
   ```
   cd client
   npm install
   npm run dev
   ```
3. Open the client URL (usually http://localhost:5173), enter a display name and join a room.

## Deploying to Render
1. Push this repository to GitHub.
2. Create two Render services:
   - Web Service (server) — Root directory: `server`, Start command: `npm start`
   - Static Site (client) — Root directory: `client`, Build command: `npm install && npm run build`, Publish directory: `dist`
3. After deploying the backend, copy its URL.
4. In the frontend service on Render, set environment variable:
   `VITE_SOCKET_URL` = `https://your-backend-url.onrender.com`
5. Redeploy the frontend.

## Notes
- This simple app does not include authentication or database persistence.
- For production, consider using a database and authentication, and enable HTTPS and proper CORS.
