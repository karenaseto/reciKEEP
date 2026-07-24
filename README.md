# reciKEEP

A frontend-first recipe organizer for links you find on Instagram Reels, TikTok, YouTube, and recipe websites — one place instead of scattered bookmarks and app-specific saves.

**Live demo:** https://karenaseto.github.io/reciKEEP/
**Recipe-reader backend:** https://recikeep-server.onrender.com (hosted on Render's free tier — see note below about cold starts)
**Database & auth:** Supabase (Postgres + Google OAuth)

## What this version includes

- **Sign in with Google** to save your own recipes to your own account — recipes, categories, and subcategories are stored in Postgres (via Supabase) scoped to your user, not shared with other visitors, and available from any device you sign into
- Sidebar-based layout: All Recipes / Favorites, plus a category tree with nested subcategories
- Inline category & subcategory management right in the sidebar — add, rename, and delete without leaving the page
- Click a category or subcategory to filter the recipe grid to it
- Add Recipe flow: paste a link, hit "Fetch recipe" to auto-fill real details:
  - **Recipe websites** — real title + photo, read from the page's Recipe structured data or Open Graph tags
  - **TikTok** — real caption + thumbnail, read via TikTok's public oEmbed API. The caption auto-fills Notes since it's genuine recipe content (ingredients/steps creators put in the caption), not filler text.
  - **YouTube** — real title + thumbnail, read via YouTube's public oEmbed API (falls back to YouTube's predictable thumbnail URL pattern if oEmbed doesn't return one)
  - **Instagram Reels** — placeholder only; see note below on why
- Search bar and source-type filter layered on top of the current sidebar selection
- Favorite toggle per recipe
- Responsive layout with a collapsible sidebar drawer on mobile

## Files

- `index.html` — app shell: sign-in gate, sidebar, topbar, recipe grid, add/edit recipe dialog
- `styles.css` — layout, colors, and typography
- `data.js` — source-type placeholder images (`buildSeedData` is unused now that data lives in Supabase, kept around for local dev/reference)
- `app.js` — Supabase client + auth flow, all app state/rendering, sidebar category/subcategory CRUD, recipe CRUD
- `server/` — small Node backend that reads real recipe data server-side so the frontend can auto-fill it. Deployed at the Render URL above; `app.js` points at it directly.

## How to run it locally

The frontend already talks to the live Supabase project and Render backend, so you only need to run the frontend to try the app. Because it uses ES modules (`type="module"`), run it with a local server instead of opening the file directly:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` and sign in with Google. (VS Code Live Server works too.) `http://localhost:8000` and `http://localhost:8123` are both already registered as allowed redirect URLs in Supabase; other ports will need to be added there first (Authentication → URL Configuration) or the OAuth redirect will fail.

### Running the backend locally instead (optional)

Only needed if you're developing `server/` itself. Otherwise skip this — the deployed backend is already live.

```bash
cd server
npm install   # first time only
npm start
```

This starts a server at `http://localhost:8787`. If you do this, update `RECIPE_READER_ENDPOINT` at the top of `app.js` to point at `http://localhost:8787/api/parse-recipe` instead of the Render URL.

## Important notes

- **Auth & data**: recipes/categories/subcategories live in a Supabase Postgres database with Row Level Security — each table has a policy restricting rows to `auth.uid() = user_id`, so a signed-in user can only ever read/write their own data, enforced at the database level regardless of what the client sends.
- **Google OAuth**: the Google Cloud OAuth client is in "Production" publishing status with only the default non-sensitive scopes (email/profile/openid), so no Google app-review process was needed — any Google account can sign in.
- **Recipe websites**: the backend fetches the page server-side (to avoid a browser CORS restriction that blocks this from working in `app.js` directly) and reads whichever of these the page already publishes — Recipe structured data (JSON-LD) if present, otherwise Open Graph title/image tags, otherwise the page `<title>`. It does not scrape ingredients/steps yet.
- **TikTok**: uses TikTok's own public, unauthenticated oEmbed endpoint (`tiktok.com/oembed`) to get the real caption and thumbnail — this is a documented, stable API, not scraping.
- **YouTube**: uses YouTube's own public, unauthenticated oEmbed endpoint (`youtube.com/oembed`) for the real title/thumbnail, with a fallback to constructing the thumbnail URL directly from the video ID (`img.youtube.com/vi/{id}/hqdefault.jpg`) if oEmbed doesn't return one.
- **Instagram Reels are still a placeholder.** Instagram's public oEmbed was discontinued years ago; the current version requires a Meta Developer app that's been through App Review with specific permissions (a business-verification process, not just an API key), and even then typically only covers content the app owner manages — not arbitrary public Reels. Scraping Instagram's HTML instead is unreliable (non-logged-in requests get served a login wall) and against their Terms of Service, so this app doesn't attempt it.
- Some recipe sites (e.g. allrecipes.com, simplyrecipes.com) block requests from cloud-hosting IP addresses as an anti-bot measure, so fetching those specific sites from the deployed backend will fail and fall back to a placeholder — that's the site blocking the server, not a bug. Most independent recipe blogs and many larger sites work fine (tested working: food.com, loveandlemons.com).
- The recipe-reader backend is on Render's **free tier**, which spins down after 15 minutes of inactivity. The first "Fetch recipe" request after idle time can take 30–50 seconds while it wakes back up — later requests are fast. This is expected, not broken.
- The recipe-reader backend blocks requests aimed at localhost/private network addresses as a basic safety measure. It has permissive CORS and no auth/rate limiting, appropriate for this personal/portfolio use case but worth hardening before any heavier use.
