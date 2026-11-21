# Reelgood — Movie Explorer

A responsive show discovery app built with React and the TVMaze API. Browse popular shows, search by title, filter by genre, and open a detail view for ratings, synopsis, cast-independent show information, and official links.

## Run locally

```bash
npm install
npm run dev
```

TVMaze is a public API and does not require an API key. The app uses its `/shows?page=0` endpoint for browsing and `/search/shows?q=...` for title search.

## Production build

```bash
npm run build
npm run preview
```
