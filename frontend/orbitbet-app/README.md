# eQual OrbitBet Frontend

Binary options betting interface for eQual platform.

## Features

- Real-time price tracking
- Market selection (Crypto, Forex)
- UP/DOWN directional betting
- Adjustable stake amounts
- Price gauge visualization

## Getting Started

```bash
npm install
npm run dev
```

App runs on `http://localhost:5175`

## Project Structure

- `src/pages/BetPage.jsx` - Main betting interface
- `src/api.js` - API client with token injection
- `src/App.jsx` - Token extraction and routing

## Integration

- Connects to OrbitBet backend service on port 8003
- Requires authentication token in localStorage
- Redirects to auth-app if token is missing/invalid
