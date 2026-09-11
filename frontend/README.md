# PlotFarm Frontend

This is the React frontend application for PlotFarm, built with Vite, TypeScript, and Tailwind CSS.

## Setup & Running

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. By default, the `VITE_API_URL` uses the Vite proxy `/api/v1` which points to `http://localhost:5000` as configured in `vite.config.ts`. You don't need to change anything unless you want a direct connection.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Authentication Demo
Since the database might not be seeded initially, you can use the predefined demo accounts:
- **Admin**: `admin`
- **Nông Dân**: `farmer`
- **Khách Hàng**: `customer`

If you click the demo account buttons on the login page or enter these usernames, you will be logged in with a mock session if the backend cannot be reached.
