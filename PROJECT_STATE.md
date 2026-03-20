# eQual Platform — Project State Document
> Version: 4.0 — Build Phase  
> Last updated: March 2026  
> Purpose: Full handoff document. Paste at the start of any new session to restore full context instantly.

---

## 1. What Is eQual

eQual is a simulation (paper) trading platform built mobile-first for African markets. Users deposit virtual funds, trade forex/crypto/stocks on live candlestick charts, copy trades from top-ranked traders, bet on market movements via OrbitBet, find arbitrage opportunities, and use Peter AI to find setups. No real money is involved.

**Slogan:** *Complexity is the enemy of execution*

**Core product principles:**
- **Currency is a language** — every price, spread, P&L, and balance displays in the user's native currency. A user in Lagos sees NGN. A user in Johannesburg sees ZAR. The app never forces mental conversion.
- **Simplicity at the surface, depth underneath** — the UI must feel simple to anyone regardless of age or financial literacy.
- **Habit by design** — every screen, interaction, and notification is intentionally designed to create return visits and engagement loops.

---

## 2. Architecture

### Decisions locked in
| Decision | Choice |
|----------|--------|
| Gateway | FastAPI — validates JWT once, proxies to services |
| Inter-service communication | REST HTTP |
| Frontend composition | Separate micro-frontends, standalone Vite/React apps |
| Shared state | localStorage — `equal_token` + `equal_user` |
| Deployment | Local Docker Compose for now |
| Designs | Hand-drawn sketches → mockup → approved → coded |

### Service map
| Service | Port | Database | Owns |
|---------|------|----------|------|
| gateway | 8000 | none | Routing, JWT validation, rate limiting |
| auth-service | 8001 | auth_db | Register, login, JWT, user profile, country/currency |
| wallet-service | 8002 | wallet_db | Balance, deposit, withdraw, transactions, margin |
| trading-service | 8003 | trading_db | Symbols, prices, orders, trades, Peter AI |
| arbitrage-service | 8004 | arb_db | Exchange feeds, spread calc, opportunities |
| follow-service | 8005 | follow_db | Leaderboard, follows, copy trading, commissions |
| orbitbet-service | 8006 | orbitbet_db | Betting engine, odds, bet history |

### Frontend apps
| App | Port | Colour | Purpose |
|-----|------|--------|---------|
| shell | 5170 | — | Bottom nav, landing page, routes between apps |
| auth-app | 5171 | Cyan `#38bdf8` | Register, Login |
| trading-app | 5172 | Green `#4ade80` | Chart, orders, trades, Peter AI |
| arb-app | 5173 | Gold `#facc15` | Arbitrage dashboard |
| follow-app | 5174 | Pink `#f472b6` | Leaderboard, copy trading |
| orbitbet-app | 5175 | Orange `#f97316` | OrbitBet |
| profile-app | 5176 | Cyan `#38bdf8` | Profile, settings, logout |

### Gateway routing table
```
/api/auth/*         → auth-service:8000
/api/wallet/*       → wallet-service:8000
/api/prices/*       → trading-service:8000
/api/orders/*       → trading-service:8000
/api/trades/*       → trading-service:8000
/api/peter/*        → trading-service:8000
/api/arb/*          → arbitrage-service:8000
/api/leaderboard/*  → follow-service:8000
/api/follow/*       → follow-service:8000
/api/copy/*         → follow-service:8000
/api/bet/*          → orbitbet-service:8000
```

### JWT flow
1. Request arrives at gateway with `Authorization: Bearer <token>`
2. Gateway decodes JWT using shared secret
3. On success, gateway injects `X-User-ID` header and forwards request
4. Downstream services trust `X-User-ID` — no re-validation needed

---

## 3. Repo Structure

```
equal-platform/
├── .env
├── docker-compose.yml
├── PROJECT_STATE.md
│
├── services/
│   ├── gateway/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   └── router.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── auth-service/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   └── routers/
│   │   │       └── auth.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── wallet-service/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   └── routers/
│   │   │       └── wallet.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── trading-service/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── services/
│   │   │   │   ├── price_service.py
│   │   │   │   └── peter_service.py
│   │   │   └── routers/
│   │   │       ├── prices.py
│   │   │       ├── orders.py
│   │   │       ├── trades.py
│   │   │       └── peter.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── arbitrage-service/
│   ├── follow-service/
│   └── orbitbet-service/
│
└── frontend/
    ├── shared/
    │   ├── constants.js
    │   ├── currency.js
    │   └── api.js
    ├── shell/          (port 5170)
    ├── auth-app/       (port 5171)
    ├── trading-app/    (port 5172)
    ├── arb-app/        (port 5173)
    ├── follow-app/     (port 5174)
    ├── orbitbet-app/   (port 5175)
    └── profile-app/    (port 5176)
```

---

## 4. Environment Variables

```env
# Postgres
POSTGRES_USER=equal
POSTGRES_PASSWORD=equal2026

# Auth Service
AUTH_SECRET_KEY=equal-auth-secret-2026-change-in-prod
AUTH_DB_URL=postgresql+asyncpg://equal:equal2026@auth-db:5432/auth_db

# Wallet Service
WALLET_DB_URL=postgresql+asyncpg://equal:equal2026@wallet-db:5432/wallet_db

# Trading Service
TRADING_DB_URL=postgresql+asyncpg://equal:equal2026@trading-db:5432/trading_db
COINGECKO_API_URL=https://api.coingecko.com/api/v3
FRANKFURTER_API_URL=https://api.frankfurter.app
ANTHROPIC_API_KEY=your-anthropic-key-here

# Arbitrage Service
ARB_DB_URL=postgresql+asyncpg://equal:equal2026@arb-db:5432/arb_db

# Follow Service
FOLLOW_DB_URL=postgresql+asyncpg://equal:equal2026@follow-db:5432/follow_db

# OrbitBet Service
ORBITBET_DB_URL=postgresql+asyncpg://equal:equal2026@orbitbet-db:5432/orbitbet_db

# Redis
REDIS_URL=redis://redis:6379

# Gateway
GATEWAY_SECRET_KEY=equal-auth-secret-2026-change-in-prod
AUTH_SERVICE_URL=http://auth-service:8000
WALLET_SERVICE_URL=http://wallet-service:8000
TRADING_SERVICE_URL=http://trading-service:8000
ARB_SERVICE_URL=http://arb-service:8000
FOLLOW_SERVICE_URL=http://follow-service:8000
ORBITBET_SERVICE_URL=http://orbitbet-service:8000

# CORS
ALLOWED_ORIGINS=http://localhost:5170,http://localhost:5171,http://localhost:5172,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
```

---

## 5. Shared State — localStorage

Every frontend app reads and writes these two keys:

```js
localStorage.getItem("equal_token")
// JWT — set by auth-app on login/register

localStorage.getItem("equal_user")
// JSON: { id, display_name, email, country, currency_code, currency_symbol }
// Set by auth-app after /api/auth/me
```

### Currency utility — frontend/shared/currency.js
```js
export function getUser() {
  try { return JSON.parse(localStorage.getItem("equal_user") || "null"); }
  catch { return null; }
}
export function getCurrencySymbol() {
  return getUser()?.currency_symbol || "R";
}
export function formatCurrency(amount, decimals = 2) {
  const sym = getCurrencySymbol();
  const num = Number(amount || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sym} ${num}`;
}
```

---

## 6. Design System

### Colour palette
| Colour | Hex | Used for |
|--------|-----|---------|
| Cyan | `#38bdf8` | Brand, auth, profile, entry lines |
| Purple | `#a78bfa` | Peter AI, subscription, protection |
| Green | `#4ade80` | Profit, TP hit, buy direction |
| Red | `#f87171` | Loss, SL hit, deficit |
| Gold | `#facc15` | Leaderboard, arbitrage, live price |
| Pink | `#f472b6` | Follow tab, copy trading |
| Orange | `#f97316` | OrbitBet, countdowns, warnings |
| Dark bg | `#05050e` | App background — all screens |

### Typography
- Font: `'Courier New', monospace` — entire platform
- Section labels: `10–11px, font-weight:bold, color:#ffffff, letter-spacing:1px`
- Dim labels: `8–9px, color:#5050a0, letter-spacing:1–2px, ALL CAPS`
- Body text: `11–13px, color:#c8c8ee`
- Values: `bold, color:#e8e8ff`

### Component tokens
```
App bg:         #05050e
Panel bg:       #0d0820
Card bg:        #0a0a1e
Border default: 1px solid #1e1e3a
Border active:  1px solid {colour}66
Input bg:       #0d0820
Input border:   1px solid #2e2e58
Active fill:    {colour}22
Button border:  2px solid {colour}
Border radius:  8px inputs, 10–12px cards
```

---

## 7. Screen Inventory — All Approved

| Screen | App | Status |
|--------|-----|--------|
| Register | auth-app | APPROVED |
| Login | auth-app | APPROVED |
| Landing page | shell | APPROVED |
| Bottom navigation | shell | APPROVED |
| Trading dashboard | trading-app | APPROVED |
| Peter AI modal | trading-app | APPROVED |
| Arbitrage dashboard | arb-app | APPROVED |
| Follow / Leaderboard | follow-app | APPROVED |
| Copy Trade modal | follow-app | APPROVED |
| OrbitBet | orbitbet-app | APPROVED |
| Profile / Settings | profile-app | APPROVED |
| Wallet modal | shell/wallet | PENDING DESIGN |

---

## 8. API Endpoints — Full Spec

### auth-service (port 8001)
```
POST  /api/auth/register   { display_name, email, password, country, currency_code, currency_symbol }
POST  /api/auth/login      OAuth2 form → { access_token }
GET   /api/auth/me         → { id, display_name, email, country, currency_code, currency_symbol }
PUT   /api/auth/me         Update profile
POST  /api/auth/verify     Validate token → used by gateway internally
```

### wallet-service (port 8002)
```
GET   /api/wallet          → { balance, margin, available }
POST  /api/wallet/deposit  { amount }
POST  /api/wallet/withdraw { amount }
GET   /api/wallet/history  → [ transactions ]
POST  /api/wallet/reserve  { amount, reference }
POST  /api/wallet/release  { amount, reference, pnl }
POST  /api/wallet/debit    { amount, reference }
POST  /api/wallet/credit   { amount, reference }
```

### trading-service (port 8003)
```
GET   /api/prices/{symbol}
POST  /api/orders/place         { symbol, direction, lot_size, volume, entry, tp, sl }
GET   /api/orders/pending
DELETE /api/orders/{id}
POST  /api/orders/{id}/activate { activation_price }
GET   /api/trades/open
POST  /api/trades/{id}/close    { close_price, close_reason }
POST  /api/trades/close-all
GET   /api/trades/history
POST  /api/peter/analyse        { symbol, direction, entry, tp, sl, price }
```

### arbitrage-service (port 8004)
```
GET   /api/arb/opportunities
GET   /api/arb/exchanges
POST  /api/arb/execute          { opportunity_id, amount, lot_size }
GET   /api/arb/history
```

### follow-service (port 8005)
```
GET   /api/leaderboard
POST  /api/follow/{trader_id}
DELETE /api/follow/{trader_id}
GET   /api/following
POST  /api/copy                 { trader_id, trade_id, lot_size, volume }
GET   /api/copy/active
```

### orbitbet-service (port 8006)
```
GET   /api/bet/markets
POST  /api/bet/place            { symbol, direction, stake }
GET   /api/bet/active
GET   /api/bet/history
GET   /api/bet/stats
```

---

## 9. Database Schemas

### auth_db
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    display_name    VARCHAR(100),
    country         VARCHAR(100) DEFAULT 'South Africa',
    currency_code   VARCHAR(10)  DEFAULT 'ZAR',
    currency_symbol VARCHAR(5)   DEFAULT 'R',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### wallet_db
```sql
CREATE TABLE wallets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID UNIQUE NOT NULL,
    balance    NUMERIC(18,4) DEFAULT 0,
    margin     NUMERIC(18,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    type        VARCHAR NOT NULL,
    amount      NUMERIC(18,4) NOT NULL,
    description VARCHAR,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### trading_db
```sql
CREATE TABLE pending_orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    symbol      VARCHAR NOT NULL,
    direction   VARCHAR NOT NULL,
    lot_size    VARCHAR NOT NULL,
    volume      INTEGER DEFAULT 1,
    entry_price NUMERIC(18,6) NOT NULL,
    take_profit NUMERIC(18,6),
    stop_loss   NUMERIC(18,6),
    margin      NUMERIC(18,4) NOT NULL,
    status      VARCHAR DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE open_trades (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    symbol      VARCHAR NOT NULL,
    direction   VARCHAR NOT NULL,
    lot_size    VARCHAR NOT NULL,
    volume      INTEGER DEFAULT 1,
    entry_price NUMERIC(18,6) NOT NULL,
    take_profit NUMERIC(18,6),
    stop_loss   NUMERIC(18,6),
    margin      NUMERIC(18,4) NOT NULL,
    opened_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trade_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,
    symbol       VARCHAR NOT NULL,
    direction    VARCHAR NOT NULL,
    lot_size     VARCHAR NOT NULL,
    volume       INTEGER DEFAULT 1,
    entry_price  NUMERIC(18,6) NOT NULL,
    close_price  NUMERIC(18,6) NOT NULL,
    take_profit  NUMERIC(18,6),
    stop_loss    NUMERIC(18,6),
    pnl          NUMERIC(18,4) NOT NULL,
    close_reason VARCHAR NOT NULL,
    opened_at    TIMESTAMPTZ NOT NULL,
    closed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE peter_usage (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date    DATE DEFAULT CURRENT_DATE,
    uses    INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);
```

### orbitbet_db
```sql
CREATE TABLE bets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,
    symbol       VARCHAR NOT NULL,
    direction    VARCHAR NOT NULL,
    stake        NUMERIC(18,4) NOT NULL,
    round_1      VARCHAR,
    round_2      VARCHAR,
    round_3      VARCHAR,
    wins         INTEGER DEFAULT 0,
    losses       INTEGER DEFAULT 0,
    status       VARCHAR DEFAULT 'ACTIVE',
    payout       NUMERIC(18,4),
    multiplier   NUMERIC(5,2) DEFAULT 1.85,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    resolved_at  TIMESTAMPTZ
);

CREATE TABLE player_stats (
    user_id       UUID PRIMARY KEY,
    xp            INTEGER DEFAULT 0,
    level         INTEGER DEFAULT 1,
    win_streak    INTEGER DEFAULT 0,
    best_streak   INTEGER DEFAULT 0,
    login_streak  INTEGER DEFAULT 0,
    total_bets    INTEGER DEFAULT 0,
    total_wins    INTEGER DEFAULT 0,
    last_login    DATE DEFAULT CURRENT_DATE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. Habit-Forming Design Principles

### The Hook Model (every feature implements this)
| Stage | eQual implementation |
|-------|---------------------|
| Trigger | Push notification — Peter AI alert, copy trade, arb window |
| Action | Tap → one tap to act |
| Variable reward | TP hit (win) or SL hit (loss) — unpredictability is key |
| Investment | Margin locked, order pending, trader followed |

### Key mechanics built into every screen
- **Variable reward** — TP/SL results, OrbitBet round reveals
- **Streaks** — trading streak, OrbitBet win streak, login streak
- **Social proof** — live trader count, leaderboard rank movement
- **Scarcity** — Peter AI limit (3/day FREE), arb window countdown
- **Loss aversion** — real-time P&L, SL approaching notification
- **Sunk cost** — margin locked, pending orders, open positions
- **Ownership language** — "Your wallet", "Your traders", "Your P&L"

### Re-engagement notifications
| Trigger | Message |
|---------|---------|
| Peter detects setup | "Peter AI: BTC/USD breakout forming" |
| Followed trader opens | "TheboKing just opened BUY USD/ZAR — copy?" |
| Arb opportunity | "R1,240 spread — 3 min window" |
| TP hit | "USD/ZAR hit TP — +R142" |
| SL hit | "USD/ZAR stopped out. Peter has a new setup." |
| Missed setup | "You missed BTC/USD — +R890. Don't miss the next." |
| Streak at risk | "Your 7-day streak ends in 2 hours" |
| Inactive 48h | "Peter found 3 setups while you were away" |

---

## 11. OrbitBet — Full Spec

### How it works
- Player picks market (Crypto/Forex) and symbol
- Watches live slot-machine price ticker
- Sets stake (min R10, max R10,000)
- Calls UP or DOWN
- 3 rounds resolve one by one
- Win 2 of 3 → payout at 1.85x stake
- Orbit mechanic: planet steps inward ring by ring, green=win red=loss
- Near miss (1-1 into round 3) → amber flash + screen shake

### Gamification
- Win streak counter with fire icon
- XP per bet: win=50xp + streak bonus, loss=10xp
- Level = xp // 500 + 1
- Login streak — daily return mechanic
- Milestone banners at 3, 5, 10 win streaks
- Daily free bet — drives daily opens
- Jackpot pool visible on home screen

---

## 12. Build Roadmap

### Phase 1 — Infrastructure (IN PROGRESS)
- [x] Repo created: `equal-platform`
- [x] `.env` file
- [x] `docker-compose.yml` — all 6 DBs + Redis + 7 services
- [ ] Gateway service files
- [ ] Auth service files
- [ ] Wallet service files
- [ ] Test: docker compose up — all containers healthy

### Phase 2 — Auth Frontend
- [ ] auth-app created (Vite/React)
- [ ] Register page coded
- [ ] Login page coded
- [ ] localStorage token + user set on success

### Phase 3 — Shell + Landing
- [ ] shell app created (Vite/React)
- [ ] Bottom navigation component
- [ ] Landing page coded

### Phase 4 — Trading
- [ ] Trading service files
- [ ] trading-app created
- [ ] Chart engine (CandleChart)
- [ ] Orders, trades, Peter AI

### Phase 5 — Follow + Copy Trading
- [ ] Follow service files
- [ ] follow-app created
- [ ] Leaderboard, copy trade modal

### Phase 6 — Arbitrage
- [ ] Arbitrage service files
- [ ] arb-app created

### Phase 7 — OrbitBet
- [ ] OrbitBet service files
- [ ] orbitbet-app created
- [ ] Orbit mechanic, streak system

### Phase 8 — Profile
- [ ] profile-app created
- [ ] XP bar, win streak, trade history

### Phase 9 — Gamification + Notifications
- [ ] Streak tracking
- [ ] Badges
- [ ] Push notifications

### Phase 10 — Deployment
- [ ] Composition strategy finalised
- [ ] VPS provisioned
- [ ] CI/CD pipeline

---

## 13. How to Continue in a New Chat

1. Paste this entire document at the start of the conversation
2. State which phase and service you are working on
3. Claude will have full context — architecture, ports, schemas, designs, roadmap

**Critical reminders:**
- Gateway port 8000, services 8001–8006, frontends 5170–5176
- Each service has its own database — never share
- JWT validated at gateway — services trust `X-User-ID` header
- localStorage: `equal_token` and `equal_user`
- Currency is a language — all amounts in user's native currency
- No emojis in UI — SVG icons only
- No heredocs in Git Bash — write files via Python inside Docker
- Section labels are white (`#ffffff`) and bold, not dim grey

---

*eQual — Complexity is the enemy of execution*