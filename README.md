# reciKEEP

A frontend-first recipe organizer for links you find on Instagram Reels, TikTok, YouTube, and recipe websites — one place instead of scattered bookmarks and app-specific saves.

## What this version includes

- Sidebar-based layout: All Recipes / Favorites, plus a category tree with nested subcategories
- Inline category & subcategory management right in the sidebar — add, rename, and delete without leaving the page
- Click a category or subcategory to filter the recipe grid to it
- Add Recipe flow: paste a link, hit "Fetch recipe" to auto-fill title/thumbnail/source type. For plain recipe websites, this now does a **real read** of the page (see `server/`). For Instagram/TikTok/YouTube it still falls back to a placeholder photo — see note below.
- Search bar and source-type filter layered on top of the current sidebar selection
- Favorite toggle per recipe
- Responsive layout with a collapsible sidebar drawer on mobile
- Local browser storage with `localStorage`
- Starter sample recipes and categories

## Files

- `index.html` — app shell: sidebar, topbar, recipe grid, add/edit recipe dialog
- `styles.css` — layout, colors, and typography
- `data.js` — seed categories, subcategories, recipes, and source-type placeholder images
- `app.js` — all app state, rendering, sidebar category/subcategory CRUD, recipe CRUD, and localStorage logic
- `server/` — small Node backend that reads a recipe webpage's Open Graph tags / Recipe schema so the frontend can auto-fill the real title and photo

## How to run it locally

This app has two pieces now: the static frontend, and a small backend that does the real link-reading. Run both.

### 1. Start the backend (recipe reader)

```bash
cd server
npm install   # first time only
npm start
```

This starts a server at `http://localhost:8787`. Leave it running in its own terminal tab. If it's not running, "Fetch recipe" still works for website links — it just falls back to a placeholder photo instead of the real one.

### 2. Start the frontend

Because the app uses ES modules (`type="module"`), run it with a local server instead of opening the file directly. From the project's root folder (not `server/`):

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

(VS Code Live Server works too, for this piece only — the backend still needs to be started separately per the step above.)

## Important notes

- Recipes and categories are stored only in the browser on the current device. That's fine for prototyping, but not for real cross-device accounts yet.
- **Real link reading** (`server/`) currently works for plain recipe websites: it fetches the page server-side (to avoid a browser CORS restriction that blocks this from working in `app.js` directly) and reads whichever of these the page already publishes — Recipe structured data (JSON-LD) if present, otherwise Open Graph title/image tags, otherwise the page `<title>`. It does not scrape ingredients/steps yet, and it can't read Instagram Reels, TikTok, or YouTube — those platforms don't expose the same metadata and would need their own integration, so they still get a placeholder photo.
- Notes are always left blank for you to fill in — nothing is auto-written there.
- The backend blocks requests aimed at localhost/private network addresses as a basic safety measure, and is intended for local personal use only (permissive CORS, no auth, no rate limiting) — don't deploy it publicly as-is.
