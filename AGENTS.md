# DevBill — Frontend Maturity

## Verification commands (run all before every commit)

```powershell
# 1. Lint
cd frontend; npm run lint

# 2. Build
cd frontend; npm run build

# 3. Django checks
cd backend; .\venv\Scripts\python.exe manage.py check --settings=config.settings.dev

# 4. Django tests
cd backend; .\venv\Scripts\python.exe -m pytest -q --tb=short

# 5. E2E (requires both servers running)
# Terminal 1:
cd backend; .\venv\Scripts\python.exe manage.py runserver
# Terminal 2:
cd frontend; npm run dev
# Terminal 3:
cd frontend; npx playwright test

# 6. Quick E2E list
cd frontend; npx playwright test --list
```

## Code splitting

- 13 lazy-loaded routes in `frontend/src/App.jsx` via `React.lazy()`
- Static imports preserved only for: stores, Brand logo, ThemeToggle, PageLoader, lucide-react icons
- Main JS chunk: ~245 kB (gzip ~82 kB)
- No chunk exceeds 500 kB threshold

## Dark mode

- Store: `frontend/src/store/themeStore.js` (Zustand + localStorage)
- Toggle: `frontend/src/components/ui/ThemeToggle.jsx` (Sun/Moon icons)
- CSS: 17 custom properties in `:root` and `.dark` overrides in `frontend/src/index.css`
- Persistence key: `devbill-theme`
- Class applied to `<html>` before React renders — zero FOUC

## E2E tests (Playwright)

- Config: `frontend/playwright.config.js`
- Specs: `frontend/tests/e2e/` (3 files, 14 tests)
- Run with: `npx playwright test`
- webServer auto-starts Django (port 8000) + Vite (port 5173) with `reuseExistingServer: true`
- Selectors use `getByRole` for links/headings/buttons, `getByPlaceholder` for inputs, `getByRole('status')` for toasts
