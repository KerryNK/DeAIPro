# DeAI Nexus Pro - Implementation Walkthrough

This document outlines the implementation of the DeAI Nexus Pro application, transitioning from a static HTML design to a full-stack React/FastAPI application.

## 1. Architecture

The application is split into two main components:
- **Backend**: Python + FastAPI (`/backend`)
  - Serves API endpoints for market stats, subnets, and content.
  - Mock data is currently used, mirroring the original HTML structure.
  - Runs on port 8000.
- **Frontend**: React + Vite (`/frontend`)
  - Modern component-based architecture.
  - Uses `react-chartjs-2` for visualizations.
  - Styled with CSS variables ported from the original design.
  - Runs on port 5173.

## 2. Implementation Details

### Backend
- **Framework**: FastAPI for high performance and easy JSON responses.
- **Data**: Data is stored in `backend/data.py` and served via `backend/main.py`.
- **CORS**: Configured to allow requests from the frontend.

### Frontend
- **Components**:
  - `Header.jsx`: Features a real-time scrolling ticker and live network stats.
  - `Sidebar.jsx`: Navigation and "Pro" features placeholder.
  - `Dashboard.jsx`: Main view with:
    - Tooltip-enriched metrics used to explain "Network Overview".
    - TAO/BTC Ratio chart with time-range controls (24H, 7D, 30D, 1Y).
    - Valuation Distribution and Market Cap charts.
  - `SubnetExplorer.jsx`: A detailed table with:
    - Sorting by Score, Market Cap, APY, Sharpe Ratio, etc.
    - Color-coded metrics for visual analysis.
    - Custom APY and Sharpe calculation logic.
  - `Research`, `Academy`, `News`: Content sections with modal support.

### UI Alignment
The React implementation faithfully recreates the original HTML design:
- **Ticker**: Infinite scrolling ticker in the header.
- **Tooltips**: Hover effects on dashboard metrics.
- **Charts**: Interactive Line and Doughnut charts matching the original aesthetics.
- **Styling**: All CSS variables and dark mode themes are preserved in `index.css`.

## 3. How to Run

### Prerequisites
- Python 3.8+
- Node.js 18+

### Steps
1. **Start Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Start Frontend** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access App**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 4. Deployment (Render)

The project is configured for deployment on Render:
- `requirements.txt` in root for Python dependencies.
- `render.yaml` for build configuration.
- `Procfile` for the start command.

## 5. Verification

- **Build**: The frontend builds successfully (`npm run build`).
- **Data**: API endpoints serve correct JSON data.
- **UI**: Visual parity with the reference HTML is achieved, including interactive elements.
