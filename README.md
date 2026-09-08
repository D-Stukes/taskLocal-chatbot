# TaskLocal Chatbot

A Vite-powered React app for the TaskLocal operations chat console.

This chatbot app is part of team project assignment completed during AI Builders Cycle LI, that offers the chatbot service to users of the TaskLocal services, which reference a dataset used by 4 separate apps (all parts of TaskLocal).  The idea is to allow each app to operate separately, but also be able to eventually connect to a commonly shared form of that dataset- stored in Superbase, where the data would dynamically be accessibly to the four apps.  This app is the standalone version. It demonstrates my capability as an AI Builder to build and design all aspects of this app using Claude Sonnet.

## Development

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

### Supabase configuration (optional)

This app can read live data from the shared TaskLocal Supabase project that
Products A, B, and D also use, instead of its bundled CSV demo data. It is
optional: with no Supabase project configured, the dashboard runs entirely
on the bundled CSV data, unchanged.

Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` to the shared project's values. For
deployment, add the same two variables in the host's environment settings,
then redeploy. Only the publishable key belongs in this frontend. Never put
a secret key or access token in `.env.local`, source code, or deployment
frontend variables.

Today, only the `listings` table is publicly readable by an anonymous
client, so it is the only source that actually goes live; `customers`,
`bookings`, `trust_safety`, and `chatbot_requests` are wired up the same
way and will start showing live data automatically if the shared project's
access rules are ever opened up to allow it, but for now they keep showing
the bundled CSV data (this is expected, not a bug -- see the comment above
the data-loading `useEffect` in `TaskLocalDashboard3Col.jsx`).

## Structure

- `src/main.jsx` mounts the React application.
- `src/App.jsx` is the application entry component.
- `src/components/TaskLocalDashboard3Col.jsx` contains the dashboard and its feature components.
- `src/styles/index.css` contains global styles and Tailwind setup.
