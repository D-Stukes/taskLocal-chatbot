# TaskLocal Chatbot

A Vite-powered React app for the TaskLocal operations chat console.

This chatbot app is part of team project assignment completed during AI Builders Cycle LI, that offers the chatbot service to users of the TaskLocal services, which reference a dataset used by 4 separate apps (all parts of TaskLocal).  The idea is to allow each app to operate separately, but also be able to eventually connect to a commonly shared form of that dataset- stored in Superbase, where the data would dynamically be accessibly to the four apps.  This app is the standalone version. It demonstrates my capability as an AI Builder to build and design all aspects of this app using Claude Sonnet.

## Development

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Structure

- `src/main.jsx` mounts the React application.
- `src/App.jsx` is the application entry component.
- `src/components/TaskLocalDashboard3Col.jsx` contains the dashboard and its feature components.
- `src/styles/index.css` contains global styles and Tailwind setup.
