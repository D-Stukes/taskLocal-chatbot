# TaskLocal Chatbot

A Vite-powered React app for the TaskLocal operations chat console.

## Development

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

### Supabase configuration

Copy `.env.example` to `.env.local` and set the Supabase project URL and
publishable key. In the Supabase dashboard, create users under
**Authentication > Users**; those credentials are used by the sign-in form.

For deployment, add the same `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` variables in the host's environment settings,
then redeploy. Only the publishable key belongs in this frontend. Never put a
secret key or access token in `.env.local`, source code, or deployment
frontend variables.

## Structure

- `src/main.jsx` mounts the React application.
- `src/App.jsx` is the application entry component.
- `src/components/TaskLocalDashboard3Col.jsx` contains the dashboard and its feature components.
- `src/styles/index.css` contains global styles and Tailwind setup.
