# SHL Assessment Recommender — Frontend

React + Vite chat UI for the FastAPI `/chat` backend.

## Local setup

```bash
npm install
cp .env.example .env
# edit .env → set VITE_API_URL to your backend (e.g. http://<ec2-ip>:8000)
npm run dev
```

## How it works

- All state (`messages`, `recommendations`, `end_of_conversation`) lives in
  `src/App.jsx`. The backend is stateless, so every send POSTs the **entire**
  messages array so far, not just the latest one.
- `src/api/chat.js` is the only place that talks to the network — swap the
  URL or add headers there if the backend changes.
- Input auto-disables once `end_of_conversation` is true or 8 turns are
  reached (matches backend's `MAX_TURNS`), with a "New chat" button to reset.

## Deploy to Vercel

1. Push this folder to a GitHub repo (or `vercel` CLI directly from here).
2. Import the repo in Vercel — framework preset "Vite" is auto-detected.
3. Add an environment variable in Vercel project settings:
   `VITE_API_URL` = your EC2 backend URL (must be reachable over the public
   internet, e.g. `http://<ec2-public-ip>:8000`).
4. Deploy.

**Note:** the backend currently has no CORS middleware. If the deployed
Vercel domain and the EC2 backend are different origins, the browser will
block the request until `CORSMiddleware` is added on the FastAPI side.
