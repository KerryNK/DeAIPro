# DeAI Nexus Pro Implementation Plan

## User Review Required
> [!IMPORTANT]
> I will be using **FastAPI** for the backend to ensure high performance and easy API creation. For the frontend, I will use **Vite + React**. The CSS provided in the HTML will be migrated to `index.css` to maintain the exact look and feel.

## Proposed Changes

### Backend (Python/FastAPI)
I will create a structured API server to serve the hardcoded data from the HTML file.

#### [NEW] `backend/main.py`
- Setup FastAPI app
- Configure CORS
- Define data structures (Pydantic models)
- Endpoints:
  - `GET /api/stats`: Returns TAO price, market cap, volume, etc.
  - `GET /api/subnets`: Returns the list of 58 subnets with their metrics.
  - `GET /api/news`: Returns the news feed.
  - `GET /api/research`: Returns research articles.
  - `GET /api/academy`: Returns academy lessons.
  - `GET /api/historical/btc`: Returns historical data (mock or real) for charts.

### Frontend (React/Vite)
I will port the HTML/JS logic into React components.

#### [NEW] `frontend/src/App.jsx`
- Main routing and layout.

#### [NEW] `frontend/src/components`
- `Header.jsx`: Top bar with ticker and live status.
- `Sidebar.jsx`: Navigation menu.
- `Dashboard.jsx`: Main "Overview" view with charts (using `react-chartjs-2`).
- `SubnetExplorer.jsx`: Table view with sorting functionality.
- `ValuationTools.jsx`: Calculators and detailed metrics.
- `Research.jsx`: Research section with modal support.
- `Academy.jsx`: Academy section with lesson viewer.
- `News.jsx`: News feed.
- `LoginModal.jsx`: Authentication modal.

#### [MODIFY] `frontend/src/components/Header.jsx`
- Implement ticker data population.
- Ensure live stats match HTML structure.

#### [MODIFY] `frontend/src/components/Dashboard.jsx`
- Add tooltips to Network Overview metrics.
- Add time pills (24H, 7D, etc.) to TAO/BTC chart.
- Add stats block (Current Ratio, Signal, etc.) to TAO/BTC section.

#### [MODIFY] `frontend/src/components/SubnetExplorer.jsx`
- Add "Sort by" dropdown.
- Add missing columns (APY, A/EM, Fund, Sharpe) to match HTML.


## Verification Plan

### Automated Tests
- I will verify the backend is running by curling the `/api/stats` endpoint.
- I will verify the build of the frontend using `npm run build`.

### Manual Verification
- Launch backend on port 8000.
- Launch frontend on port 5173.
- Verify all views (Overview, Subnet, Valuation, Research, Academy, News) load data correctly.
- Check interactivity (charts, modals, calculators).
