# Portfolio Chatbot — Frontend

A Next.js chat UI for Rahul Suthar's personal portfolio assistant. Talks to the
[backend](../backend) over a streaming API, rendering the assistant's answer token-by-token as
it's generated rather than waiting for the full response.

## Features

- **Streaming responses** — answers appear word-by-word as the model generates them, with a
  blinking cursor on the message currently streaming.
- **Chat history** — the sidebar lists past conversations grouped into Today / Yesterday /
  Previous 7 Days, each with an auto-generated title (from the model, based on the first
  exchange).
- **Long conversations** — opening a conversation loads only its most recent messages; scrolling
  to the top (or short/no-scroll conversations, right on open) automatically loads older
  messages a page at a time.
- **New chat vs. session** — a session id (identifying this browser) persists across reloads in
  `localStorage`, but each reload starts a fresh chat rather than reopening the last one; history
  stays one click away in the sidebar.
- Light / dark / system theme, mobile-responsive layout, per-IP daily question limit surfaced as
  a friendly error message.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend URL

Copy `.env.local.example` to `.env.local` and point it at your running backend (see the
[backend README](../backend/README.md) for how to start it):

```bash
cp .env.local.example .env.local
```

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the backend must already be running for
the chat to work (the status badge in the sidebar/mobile header shows whether it's reachable).

### Other scripts

```bash
npm run build   # production build
npm run start   # run a production build
npm run lint    # eslint
```

## Project structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout: fonts, metadata, ThemeProvider
│   ├── page.tsx              # The entire chat UI - session/chat state, streaming, pagination
│   └── globals.css           # Tailwind base + custom scrollbar styles
├── components/
│   ├── Sidebar.tsx            # Chat history grouped by day, new-chat button, collapse/drawer
│   ├── MobileHeader.tsx       # Mobile-only top bar: menu, new chat, theme, status
│   ├── ChatInput.tsx           # Message textarea + send button, character-limit counter
│   ├── ChatMessageBubble.tsx  # One message bubble, with the streaming cursor
│   ├── AssistantAvatar.tsx    # The assistant's avatar image
│   ├── StatusBadge.tsx        # Backend connectivity indicator (Connecting/Online/Offline)
│   ├── ThemeSwitch.tsx         # Desktop light/dark/system toggle
│   ├── ThemeIcons.tsx          # Icons + options list shared by ThemeSwitch/MobileHeader
│   ├── ThemeProvider.tsx       # Thin wrapper around next-themes
│   ├── SourcesList.tsx         # Expandable "N sources" list (not rendered by default - see the
│   │                            #   comment in ChatMessageBubble.tsx for why)
│   └── HelpButton.tsx          # Floating "?" button with a short About blurb
└── lib/
    ├── api.ts                # HTTP calls to the backend, incl. the NDJSON stream reader
    ├── types.ts               # Types mirroring backend/app/models/schemas.py
    └── assistant.ts           # Display profile (currently just { name })
```

## How streaming works

`lib/api.ts`'s `streamQuery` uses `fetch`'s readable stream directly (not axios, which buffers
the whole response body) to read the backend's newline-delimited JSON response line-by-line as
it arrives. `page.tsx`'s `send()` consumes it as an async generator, appending each token to the
assistant's message as it comes in, until a `done` or `error` event ends the stream.

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://your-backend-url -t rag-frontend .
docker run -p 3000:3000 rag-frontend
```

`NEXT_PUBLIC_API_URL` is a **build-time** arg (Next.js inlines `NEXT_PUBLIC_*` vars into the
client bundle at build time), so it must be set when building the image, not just at `docker run`.
See the root `docker-compose.yml` to run the whole stack (Postgres + Qdrant + Redis + backend +
frontend) together.
