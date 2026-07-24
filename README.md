# reciKEEP

A frontend-first recipe organizer for links you find on Instagram Reels, TikTok, YouTube, and recipe websites — one place instead of scattered bookmarks and app-specific saves.

**Live demo:** https://karenaseto.github.io/reciKEEP/
**Recipe-reader backend:** https://recikeep-server.onrender.com (hosted on Render's free tier — see note below about cold starts)

## What this version includes

- Sidebar-based layout: All Recipes / Favorites, plus a category tree with nested subcategories
- Inline category & subcategory management right in the sidebar — add, rename, and delete without leaving the page
- Click a category or subcategory to filter the recipe grid to it
- Add Recipe flow: paste a link, hit "Fetch recipe" to auto-fill title/thumbnail/source type. For plain recipe websites, this does a **real read** of the page (see `server/`). For Instagram/TikTok/YouTube it falls back to a placeholder photo — see note below.
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
- `server/` — small Node backend that reads a recipe webpage's Open Graph tags / Recipe schema so the frontend can auto-fill the real title and photo. Deployed at the Render URL above; `app.js` points at it directly.

## How to run it locally

The frontend already talks to the live backend on Render, so you technically only need to run the frontend to try the app. Because it uses ES modules (`type="module"`), run it with a local server instead of opening the file directly:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. (VS Code Live Server works too.)

### Running the backend locally instead (optional)

Only needed if you're developing `server/` itself. Otherwise skip this — the deployed backend is already live.

```bash
cd server
npm install   # first time only
npm start
```

This starts a server at `http://localhost:8787`. If you do this, update `RECIPE_READER_ENDPOINT` at the top of `app.js` to point at `http://localhost:8787/api/parse-recipe` instead of the Render URL.

## Important notes

- Recipes and categories are stored only in the browser on the current device — each visitor to the live demo gets their own blank slate with the starter sample recipes, not a shared dataset. Fine for a demo/prototype, not for real cross-device accounts yet.
- **Real link reading** (`server/`) works for plain recipe websites: it fetches the page server-side (to avoid a browser CORS restriction that blocks this from working in `app.js` directly) and reads whichever of these the page already publishes — Recipe structured data (JSON-LD) if present, otherwise Open Graph title/image tags, otherwise the page `<title>`. It does not scrape ingredients/steps yet, and it can't read Instagram Reels, TikTok, or YouTube — those platforms don't expose the same metadata and would need their own integration, so they still get a placeholder photo.
- Some recipe sites (e.g. allrecipes.com, simplyrecipes.com) block requests from cloud-hosting IP addresses as an anti-bot measure, so fetching those specific sites from the deployed backend will fail and fall back to a placeholder — that's the site blocking the server, not a bug. Most independent recipe blogs and many larger sites work fine (tested working: food.com, loveandlemons.com).
- The backend is on Render's **free tier**, which spins down after 15 minutes of inactivity. The first "Fetch recipe" request after idle time can take 30–50 seconds while it wakes back up — later requests are fast. This is expected, not broken.
- Notes are always left blank for you to fill in — nothing is auto-written there.
- The backend blocks requests aimed at localhost/private network addresses as a basic safety measure. It has permissive CORS and no auth/rate limiting, appropriate for this personal/portfolio use case but worth hardening before any heavier use.
