UI (Angular) — Quick Start & Troubleshooting

Prerequisites
- Node.js (LTS) installed and on PATH. Verify with:
  node -v
  npm -v
- .NET 10 SDK installed and on PATH. Verify with:
  dotnet --info
- Trust ASP.NET Core dev certificate (if using HTTPS local backend):
  dotnet dev-certs https --trust

Important files
- proxy.conf.json — located at UI/proxy.conf.json. Used by ng serve to proxy /api requests to the backend.
- package.json — contains npm scripts: start, build, build:prod
- angular.json — outputPath is dist/football-ai-dashboard (production build)

Commands (PowerShell)
1) Start backend (in separate terminal)
   cd C:\Users\rhutu\source\repos\Game-Developer-Hackathon
   dotnet run --project Game-Developer-Hackathon.csproj
   -> Backend URL: https://localhost:51979 (check Properties/launchSettings.json if different)

2) Install frontend dependencies (run once)
   cd C:\Users\rhutu\source\repos\Game-Developer-Hackathon\UI
   npm install

3) Start frontend dev server with proxy (recommended)
   cd C:\Users\rhutu\source\repos\Game-Developer-Hackathon\UI
   npm run start
   # or directly:
   npx ng serve --proxy-config proxy.conf.json --open
   -> Dev URL: http://localhost:4200
   -> /api/* requests made by the Angular app will be forwarded to https://localhost:51979

4) Build frontend for production and serve from backend
   cd UI
   npm run build:prod
   # Output at UI/dist/football-ai-dashboard
   # Start backend (if not running) — it will serve static files from the UI dist folder
   dotnet run --project ..\Game-Developer-Hackathon\Game-Developer-Hackathon.csproj
   -> Frontend production URL: https://localhost:51979/

How to verify proxy is applied
- From a terminal (while ng serve is running with proxy):
  curl -v "http://localhost:4200/api/matchintelligence/generate-events?count=1"
  - If proxied correctly you will get the same response as calling the backend directly:
	curl -k "https://localhost:51979/api/matchintelligence/generate-events?count=1"
- Watch ng serve console output; proxied requests are logged when proxy.conf.json contains "logLevel": "info".

Common issues & solutions
- 404 at http://localhost:4200/api/…
  - Cause: ng serve started without the proxy config or started from wrong folder.
  - Fix: Stop ng serve and start it from the UI folder with the proxy:
	cd UI
	npx ng serve --proxy-config proxy.conf.json

- "proxy.conf.json not found" (Browser shows source not found)
  - Confirm the file path: C:\Users\rhutu\source\repos\Game-Developer-Hackathon\UI\proxy.conf.json
  - Ensure you run ng serve from the UI folder (current working directory). The CLI resolves the proxy file relative to cwd.

- HTTPS certificate / SSL errors when proxying to backend
  - Trust the dev certificate: dotnet dev-certs https --trust
  - proxy.conf.json sets "secure": false to allow using a self-signed cert. Keep secure:false for local dev.

- Node not recognized / npx errors
  - Install Node LTS from https://nodejs.org/ or use nvm-windows. Restart terminal after install.

- Wrong backend port
  - Check Properties/launchSettings.json for applicationUrl in the Game-Developer-Hackathon project and update proxy.conf.json if needed.

Optional proxy path rewrite (strip /api prefix)
- If you want backend to receive requests without the "/api" prefix, add this to UI/proxy.conf.json:
  "pathRewrite": { "^/api": "" }

Contact / next steps
- If you want, I can add a short README in the repo root with the same run steps, or add a preflight check script to package.json that asserts Node is present before starting.
