# Frontend Project Structure

```text
frontend/
  src/
    components/
      layout/
        AppLayout.tsx
        Sidebar.tsx
        TopNav.tsx
        navigation.tsx
    lib/
      queryClient.ts
    pages/
      PlaceholderPage.tsx
    services/
      api.ts
      types.ts
    styles/
      index.css
    utils/
      gradingUtility.ts
    App.tsx
    main.tsx
  .env.example
  index.html
  package.json
  tailwind.config.ts
  postcss.config.js
  tsconfig.json
  vite.config.ts
```

The frontend is isolated in `frontend/` so the backend can keep its own
Node/Express `package.json` in `backend/`.
