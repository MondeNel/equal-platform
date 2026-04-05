// API service layer — aligned to FastAPI arbitrage backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8004";

// ── Helpers ─────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Replace with real user ID from your auth system
      "X-User-ID": import.meta.env.VITE_USER_ID || "11111111-1111-1111-1111-111111111111",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Opportunities ────────────────────────────────────────────────────
/**
 * GET /api/arb/opportunities
 * Returns top 10 best arbitrage opportunities across all exchange pairs.
 * Each opportunity includes buy/sell exchange, prices, spread, and profit data.
 */
export async function fetchOpportunities() {
  return apiFetch("/api/arb/opportunities");
}

// ── Exchange Prices ──────────────────────────────────────────────────
/**
 * GET /api/arb/exchanges
 * Returns current prices for all supported symbols across all exchanges.
 * Shape: { Luno: { "BTC/USD": { usd, zar }, ... }, Binance: { ... }, ... }
 */
export async function fetchExchangePrices() {
  return apiFetch("/api/arb/exchanges");
}

// ── Profit Estimate ──────────────────────────────────────────────────
/**
 * POST /api/arb/estimate-profit
 * Estimates profit for a specific exchange pair without executing the trade.
 * Returns full fee breakdown: exchange fees, platform fee (10%), net profit.
 *
 * @param {{ symbol, buy_exchange, sell_exchange, amount }} data
 */
export async function estimateProfit(data) {
  return apiFetch("/api/arb/estimate-profit", {
    method: "POST",
    body: JSON.stringify({
      symbol: data.symbol,
      buy_exchange: data.buy_exchange,
      sell_exchange: data.sell_exchange,
      amount: data.amount,
    }),
  });
}

// ── Execute Market Order ─────────────────────────────────────────────
/**
 * POST /api/arb/execute
 * Executes an immediate market arbitrage trade.
 * Reserves stake → calculates spread → releases with profit.
 *
 * @param {{ symbol, buy_exchange, sell_exchange, amount, opportunity_id? }} data
 */
export async function executeArbitrage(data) {
  return apiFetch("/api/arb/execute", {
    method: "POST",
    body: JSON.stringify({
      symbol: data.symbol,
      buy_exchange: data.buy_exchange,
      sell_exchange: data.sell_exchange,
      amount: data.amount,
      opportunity_id: data.opportunity_id ?? null,
    }),
  });
}

// ── Create Limit Order ───────────────────────────────────────────────
/**
 * POST /api/arb/limit/create
 * Creates a limit order that executes when buy exchange price reaches target.
 * Background worker checks every 10s (matches PRICE_CACHE_TTL).
 *
 * @param {{ symbol, buy_exchange, sell_exchange, amount, target_spread_pct, expires_in_minutes? }} data
 */
export async function createLimitOrder(data) {
  return apiFetch("/api/arb/limit/create", {
    method: "POST",
    body: JSON.stringify({
      symbol: data.symbol,
      buy_exchange: data.buy_exchange,
      sell_exchange: data.sell_exchange,
      amount: data.amount,
      target_spread_pct: data.target_spread_pct,
      expires_in_minutes: data.expires_in_minutes ?? 60,
    }),
  });
}

// ── Trade History ────────────────────────────────────────────────────
/**
 * GET /api/arb/history
 * Returns last 50 executed trades for the authenticated user.
 */
export async function fetchTradeHistory() {
  return apiFetch("/api/arb/history");
}

// ── Limit Order History ──────────────────────────────────────────────
/**
 * GET /api/arb/limit/history
 * Returns limit order history (EXECUTED, EXPIRED, CANCELLED).
 */
export async function fetchLimitOrderHistory() {
  return apiFetch("/api/arb/limit/history");
}

// ── Pending Limit Orders ─────────────────────────────────────────────
/**
 * GET /api/arb/limit/pending
 * Returns all pending (not yet triggered) limit orders for the user.
 */
export async function fetchPendingOrders() {
  return apiFetch("/api/arb/limit/pending");
}

// ── Cancel Limit Order ───────────────────────────────────────────────
/**
 * POST /api/arb/limit/cancel/:orderId
 */
export async function cancelLimitOrder(orderId) {
  return apiFetch(`/api/arb/limit/cancel/${orderId}`, { method: "POST" });
}

// ── Wallet Balances (placeholder) ────────────────────────────────────
/**
 * Fetches user wallet balances from the wallet service.
 * TODO: Point to actual wallet service URL when integrated.
 */
export async function fetchWalletBalances() {
  return { account: 0, current: 0 };
}