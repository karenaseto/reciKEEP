# reciKEEP

A frontend-first recipe organizer for links you find on Instagram Reels, TikTok, YouTube, and recipe websites — one place instead of scattered bookmarks and app-specific saves.

**Live demo:** https://karenaseto.github.io/reciKEEP/
**Recipe-reader backend:** https://recikeep-server.onrender.com (hosted on Render's free tier — see note below about cold starts)

## What this version includes

- Sidebar-based layout: All Recipes / Favorites, plus a category tree with nested subcategories
- Inline category & subcategory management right in the sidebar — add, rename, and delete without leaving the page
- Click a category or subcategory to filter the recipe grid to it
- Add Recipe flow: paste a link, hit "Fetch recipe" to auto-fill real details:
  - **Recipe websites** — real title + photo, read from the page's Recipe structured data or Open Graph tags
  - **TikTok** — real caption + thumbnail, read via TikTok's public oEmbed API. The caption auto-fills Notes since it's genuine recipe content (ingredients/steps creators put in the caption), not filler text.
  - **Instagram Reels** — placeholder only; see note below on why
- Search bar and source-type filter layered on top of the current sidebar selection
- Favorite toggle per recipe
- Responsive layout with a collapsible sidebar drawer on mobile
- New visitors start with a genuinely empty state (no seeded sample data) — local browser storage via `localStorage`

## Files

- `index.html` — app shell: sidebar, topbar, recipe grid, add/edit recipe dialog
- `styles.css` — layout, colors, and typography
- `data.js` — category/recipe data shape helpers and source-type placeholder images (`buildSeedData` is available but unused by default — see below)
- `app.js` — all app state, rendering, sidebar category/subcategory CRUD, recipe CRUD, and localStorage logic
- `server/` — small Node backend that reads real recipe data server-side so the frontend can auto-fill it. Deployed at the Render URL above; `app.js` points at it directly.

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

- Recipes and categories are stored only in the browser on the current device — every visitor (including you, on a different browser/device) gets their own independent, empty starting state. Nobody shares data with anyone else. Fine for a demo/prototype, not for real cross-device accounts.
- **Recipe websites**: the backend fetches the page server-side (to avoid a browser CORS restriction that blocks this from working in `app.js` directly) and reads whichever of these the page already publishes — Recipe structured data (JSON-LD) if present, otherwise Open Graph title/image tags, otherwise the page `<title>`. It does not scrape ingredients/steps yet.
- **TikTok**: uses TikTok's own public, unauthenticated oEmbed endpoint (`tiktok.com/oembed`) to get the real caption and thumbnail — this is a documented, stable API, not scraping.
- **Instagram Reels are still a placeholder.** Instagram's public oEmbed was discontinued years ago; the current version requires a Meta Developer app that's been through App Review with specific permissions (a business-verification process, not just an API key), and even then typically only covers content the app owner manages — not arbitrary public Reels. Scraping Instagram's HTML instead is unreliable (non-logged-in requests get served a login wall) and against their Terms of Service, so this app doesn't attempt it.
- Some recipe sites (e.g. allrecipes.com, simplyrecipes.com) block requests from cloud-hosting IP addresses as an anti-bot measure, so fetching those specific sites from the deployed backend will fail and fall back to a placeholder — that's the site blocking the server, not a bug. Most independent recipe blogs and many larger sites work fine (tested working: food.com, loveandlemons.com).
- The backend is on Render's **free tier**, which spins down after 15 minutes of inactivity. The first "Fetch recipe" request after idle time can take 30–50 seconds while it wakes back up — later requests are fast. This is expected, not broken.
- The backend blocks requests aimed at localhost/private network addresses as a basic safety measure. It has permissive CORS and no auth/rate limiting, appropriate for this personal/portfolio use case but worth hardening before any heavier use.
