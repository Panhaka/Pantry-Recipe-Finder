# Pantry — Recipe Finder

A responsive web app that finds recipes based on ingredients you already have. Search by ingredient, browse results, and save favorites — no backend, no build step, no sign-up.

**[Live demo](#)** ← replace with your deployed link (see below)

![Pantry screenshot](docs/screenshot.png)
<!-- Take a screenshot after you run it locally and drop it in a /docs folder, then update this line. -->

## Features

- Search recipes by ingredient using [TheMealDB](https://www.themealdb.com/api.php) public API
- Add multiple ingredient tags with keyboard input
- View full recipe details (ingredients, measurements, instructions) in a modal
- Save recipes to favorites — persisted locally in the browser (`localStorage`), so they're still there next time you open the app
- Fully responsive layout: mobile, tablet, and desktop
- Loading states and empty states handled explicitly, not left blank

## Tech stack

- **HTML5** — semantic structure
- **Tailwind CSS** (via CDN) — utility-first styling, responsive layout
- **Vanilla JavaScript** — no framework, no build tools; fetch API, DOM manipulation, localStorage
- **[TheMealDB API](https://www.themealdb.com/api.php)** — free public recipe data, no API key required

## Why this project

Built to practice consuming a real external API, managing UI state without a framework, and handling the edge cases a real app needs (loading, empty results, failed requests) rather than only the happy path.

## Run it locally

No build step — it's static files.

```bash
git clone https://github.com/YOUR_USERNAME/pantry-recipe-finder.git
cd pantry-recipe-finder
```

Then either:
- Open `index.html` directly in your browser, or
- Serve it locally (recommended, avoids some browser fetch restrictions):

```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy it (so you have a live link for your resume)

This is a static site, so any static host works. Easiest options:

**Netlify** (drag-and-drop, no CLI needed)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the project folder in
3. Copy the live URL it gives you

**GitHub Pages**
1. Push this repo to GitHub
2. Go to *Settings → Pages*
3. Set source to your main branch, root folder
4. Your site will be live at `https://YOUR_USERNAME.github.io/pantry-recipe-finder`

Once deployed, update the demo link at the top of this README.

## Project structure

pantry-recipe-finder/
├── index.html # markup + Tailwind config
├── css/
│ └── style.css # custom styles Tailwind utilities don't cover
├── js/
│ └── app.js # search, rendering, favorites, modal logic
└── README.md


## Possible next steps

- Switch from the Tailwind Play CDN to a proper Tailwind CLI/PostCSS build for production
- Add filtering by cuisine or category
- Add a "surprise me" random recipe button (TheMealDB has a `random.php` endpoint)
- Support matching against more than one ingredient at once (needs a small server-side proxy, since TheMealDB's free tier only filters by a single ingredient)

## Credits

Recipe data and images from [TheMealDB](https://www.themealdb.com/).
