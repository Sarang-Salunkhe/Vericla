# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Vericla Frontend

  The Vericla frontend is a React, TypeScript, and Vite application. The public landing page is the entry experience; its Analyze actions open the existing document workspace.

  ## Development

  Install dependencies and start the frontend:

  ```sh
  npm install
  npm run dev
  ```

  The Vite development server proxies `/api` to `http://127.0.0.1:8000` by default. Set `VERICLA_BACKEND_URL` in the frontend environment when the backend runs elsewhere. Document upload, analysis, Q&A, and comparison require the backend.

  ## Checks

  ```sh
  npm run typecheck
  npm run lint
  npm run build
  ```

  The workspace keeps uploaded document metadata and completed analyses in the current app session. It does not provide user accounts or persistent history.
