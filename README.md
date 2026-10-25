# Football AI Intelligence Dashboard

An Angular dashboard for exploring synthetic football match events and tactical analysis. It includes a live match timeline, a filtered pitch map, event and player statistics, xG trends, and an AI-agent chat panel.

<img width="1376" height="768" alt="Gemini_Generated_Image_x352x5x352x5x352" src="https://github.com/user-attachments/assets/2590b5e5-8ef0-49ad-b680-120b64e89219" />

## Requirements

- Node.js and npm
- Optional: the companion API running locally if you want to use its event generation, analysis, and chat endpoints

## Run locally

From the repository root:

```powershell
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200). The dashboard loads a sample event stream on startup. Use **Fetch Stream** to generate another stream, change the team names or event batch size, and use the pitch filters and timeline controls to explore the match. **Run AI Tactical Agent** and the chat panel request analysis from the API.

## Backend connection

The development server forwards `/api` requests to `https://localhost:51979`, as configured in [`proxy.conf.json`](./proxy.conf.json). Start the companion backend separately and make sure it is listening at that address. If its URL differs, update the `target` in `proxy.conf.json`. For a local ASP.NET Core backend using a development certificate, trust the certificate with:

```powershell
dotnet dev-certs https --trust
```

The dashboard calls these API routes:

- `GET /api/matchintelligence/generate-events`
- `POST /api/matchintelligence/analyze`
- `POST /api/matchintelligence/chat`

If an API request fails, the frontend falls back to locally generated events and local analysis/chat responses, so the dashboard can still be explored without the backend.

## Build and test

```powershell
npm run build
npm run build:prod
npm test
```

Production build files are written to `dist/football-ai-dashboard`.
