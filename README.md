# Yashveer Singh Portfolio — Enhanced

This project upgrades the single-file React portfolio with:
- A 3D interactive background built with `@react-three/fiber` + `@react-three/drei`
- Light/Dark theme via a `ThemeContext` and CSS variables (Tailwind dark mode compatible)
- Live GitHub stats for `@yashveerji`
- Reusable `useIntersectionObserver` hook for reveal-on-scroll animations

## Files
- `App.jsx` — Main application component implementing all features
- `app.js` — Previous portfolio component (unchanged); you can keep it or switch to `App.jsx`

## Install Dependencies
Run in your project root:

```powershell
npm i three @react-three/fiber @react-three/drei
```

If you are using Tailwind CSS, ensure `tailwind.config.js` includes:

```js
module.exports = {
  darkMode: 'class',
  // ...rest of your config
}
```

> The app toggles the `<html>` element's `dark` class so Tailwind dark styles apply.

## Use `App.jsx` as the App
Depending on your setup, import and render `App` from `App.jsx`.

### Vite (main.jsx)
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### Create React App (index.js)
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

If your build currently imports `./app.js`, either:
- Change it to `./App.jsx`, or
- Replace the contents of `app.js` with:

```jsx
import App from './App.jsx';
export default App;
```

## Run the App
Typical scripts (adjust to your project):

```powershell
# Vite
npm run dev

# or Create React App
npm start
```

## Deploy on Render (Static Site)

You can deploy this Vite app as a Static Site on Render. Two options:

### Option A: Use `render.yaml` (recommended)
1. Ensure your repo is on GitHub (this repo already is).
2. The file `render.yaml` is included with a Static Site definition.
3. Go to https://dashboard.render.com > New > Blueprint > Connect your repo.
4. Render will read `render.yaml` and create a Static Site named `yashveer-portfolio` with:
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
   - SPA Rewrites to `/index.html`
   - Node version pinned to 18 for build
5. Click Create Resources, wait for build and deploy to finish.

### Option B: Manual Static Site (without `render.yaml`)
1. Go to https://dashboard.render.com > New > Static Site.
2. Select your GitHub repo.
3. Fill in settings:
   - Name: `yashveer-portfolio` (any name you like)
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
   - Optional: Set Environment > Node version = 18
4. Under "Static Site Settings", enable "Redirect all requests to index.html" (SPA mode) or add a rewrite:
   - Source: `/*` → Destination: `/index.html` (Type: Rewrite)
5. Click "Create Static Site" and wait for deploy.

### Local build (for verification)
```powershell
npm ci
npm run build
npx serve dist  # optional quick preview
```

### Notes
- This project already has `index.html` at the root and the Vite output goes to `dist/`.
- Tailwind is already configured; no special server config is needed.
- If you later add environment variables, you can define them in Render under the service > Environment.

## Notes
- The 3D background renders 100 floating shapes. If performance is an issue on low-end devices, reduce the count in `App.jsx` (see `Scene()` items array).
- Theme preference persists to `localStorage` and syncs to `<html class="dark">`.
- GitHub stats fetched from: https://api.github.com/users/yashveerji

## Credits
- Three.js, React Three Fiber, Drei
- Tailwind CSS (optional)
