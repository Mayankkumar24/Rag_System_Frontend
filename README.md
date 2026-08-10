# SHL Assessment Recommender — Frontend

A conversational chat UI that helps hiring teams discover the right SHL assessments for a role. The frontend is deployed on Vercel; the backend runs on AWS EC2 with a valid SSL certificate (HTTPS).

**Live:** [https://rag-system-frontend-nine.vercel.app/](https://rag-system-frontend-nine.vercel.app/)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Styling | Vanilla CSS (custom properties, no CSS framework) |
| HTTP | Native `fetch` API |
| Deployment | Vercel (frontend) / AWS EC2 + HTTPS (backend) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Browser (Vercel)                   │
│                                                     │
│  App.jsx  ──────────────────────────────────────    │
│    │  state: messages[], recommendations[],         │
│    │         loading, endOfConversation, error      │
│    │                                                 │
│    ├── ChatWindow.jsx                               │
│    │     ├── MessageBubble.jsx  (user / assistant)  │
│    │     └── RecommendationCard.jsx  (shortlist)    │
│    │                                                 │
│    └── InputBar.jsx  (text input + send button)     │
│                                                     │
│  src/api/chat.js  ── POST /chat ──────────────────► │
└─────────────────────────────────────────────────────┘
                          │  HTTPS
                          ▼
          ┌───────────────────────────────┐
          │   AWS EC2  (FastAPI backend)  │
          │   HTTPS — valid SSL cert      │
          │                               │
          │   POST /chat                  │
          │   { messages: [...] }         │
          │          │                    │
          │   RAG pipeline (vector DB +   │
          │   LLM) returns:               │
          │   { reply,                    │
          │     recommendations,          │
          │     end_of_conversation }     │
          └───────────────────────────────┘
```

### Key design decisions

- **Stateless backend, stateful frontend.** Every request sends the complete `messages` array accumulated so far. The EC2 backend holds no session state — it derives its response purely from the conversation history passed in.
- **Conversation lifecycle.** The chat ends automatically when either the backend sets `end_of_conversation: true` or the frontend reaches `MAX_TURNS` (8). After either condition the input is disabled and a "New chat" button lets the user reset to a clean state.
- **Single network boundary.** All HTTP logic lives in `src/api/chat.js`. The `VITE_API_URL` environment variable points to the EC2 backend; swapping backends requires changing only that variable.

---

## Project Structure

```
src/
├── api/
│   └── chat.js               # fetch wrapper — only file that touches the network
├── components/
│   ├── ChatWindow.jsx         # scrollable message list + auto-scroll
│   ├── InputBar.jsx           # controlled text input + submit
│   ├── MessageBubble.jsx      # renders a single user or assistant turn
│   └── RecommendationCard.jsx # renders the SHL assessment shortlist
├── App.jsx                    # root component — owns all application state
├── index.css                  # design tokens + component styles (no framework)
└── main.jsx                   # React DOM entry point
```

### Component responsibilities

**`App.jsx`**
Root of the component tree. Owns all shared state (`messages`, `recommendations`, `loading`, `endOfConversation`, `error`). Calls `sendChatMessage` and distributes responses down to child components.

**`ChatWindow.jsx`**
Renders the full conversation history. Auto-scrolls to the bottom on every update. Shows an empty-state prompt when no messages exist, a typing indicator (`...` animation) while waiting for the backend, and the recommendation shortlist once available.

**`MessageBubble.jsx`**
Stateless. Renders a single chat bubble — dark background for `user` turns, light bordered background for `assistant` turns.

**`RecommendationCard.jsx`**
Stateless. Renders a numbered, linked list of SHL assessments returned by the backend. Each card shows the assessment name and one or more type badges (`K`, `P`, `A`, `S`, `B`, `C`, `D`, `E`) decoded from SHL's type code system.

**`InputBar.jsx`**
Controlled input form. Disables itself when `loading`, `endOfConversation`, or the turn limit is reached. Clears after every send.

**`src/api/chat.js`**
Single `sendChatMessage(messages)` export. POSTs to `VITE_API_URL/chat` with the full conversation history and returns the parsed JSON response. Throws a descriptive error for non-2xx responses.

---

## Data Flow

```
User types → InputBar.onSend()
           → App.handleSend()
               → optimistically appends user message to state
               → calls sendChatMessage(messages)   [chat.js]
                   → POST VITE_API_URL/chat  { messages }
                   ← { reply, recommendations, end_of_conversation }
               → appends assistant reply to messages
               → sets recommendations (replaces previous shortlist)
               → sets endOfConversation flag if backend signals done
```


## SHL Assessment Type Codes

`RecommendationCard` decodes single-letter codes returned by the backend:

| Code | Category |
|---|---|
| K | Knowledge & Skills |
| P | Personality & Behavior |
| A | Ability & Aptitude |
| S | Simulations |
| B | Biodata & Situational Judgement |
| C | Competencies |
| D | Development & 360 |
| E | Assessment Exercises |
