# PlotFarm Backend

This is the backend service for PlotFarm. It uses Express, ES modules, and connects to SQL Server via mssql.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update the `.env` file with your SQL Server credentials and set `PORT=5000`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## Testing API

Use `curl` or Postman to test the APIs.

Health Check:
```bash
curl http://localhost:5000/api/v1/health
```

Login:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\": \"admin\", \"password\": \"...\"}"
```
