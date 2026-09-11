# PlotFarm - Team 8

This repository contains the Frontend and Backend source code for PlotFarm.

## Prerequisites
- Node.js (v18 or higher)
- SQL Server (running locally or accessible via network)

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd PlotFarm_Team8_Dev
   ```

2. **Backend Setup**:
   - Navigate to the backend directory: `cd backend`
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update your `.env` variables (Database credentials, JWT secret, etc.).
   - Install dependencies: `npm install`
   - Start the backend server on port 5000: `npm run dev`

3. **Frontend Setup**:
   - Open a new terminal and navigate to the frontend directory: `cd frontend`
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Install dependencies: `npm install`
   - Start the frontend server: `npm run dev`

## API Testing
Once the backend is running (typically `http://localhost:5000`), you can test the Health API:
```bash
curl http://localhost:5000/api/v1/health
```

## Demo Accounts
To test the Authentication functionality on the Frontend without seeding the DB manually:
- `admin` (Admin Hệ Thống)
- `farmer` (Nông Dân)
- `customer` (Khách Hàng)
