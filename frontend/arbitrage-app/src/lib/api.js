const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchPrices(symbol = 'BTC/ZAR') {
  const response = await fetch(`${API_BASE_URL}/api/arb/prices?symbol=${encodeURIComponent(symbol)}`);
  if (!response.ok) throw new Error('Failed to fetch prices');
  return response.json();
}

export async function fetchOpportunities(symbol = 'BTC/ZAR', minSpreadPercent = 0.1) {
  const response = await fetch(
    `${API_BASE_URL}/api/arb/opportunities?symbol=${encodeURIComponent(symbol)}&min_spread_percent=${minSpreadPercent}`
  );
  if (!response.ok) throw new Error('Failed to fetch opportunities');
  return response.json();
}

export async function executeArbitrage(data) {
  const response = await fetch(`${API_BASE_URL}/api/arb/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to execute arbitrage');
  }
  return response.json();
}

export async function fetchTradeHistory(limit = 50, offset = 0) {
  const response = await fetch(`${API_BASE_URL}/api/arb/trades?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error('Failed to fetch trade history');
  return response.json();
}

export async function fetchLimitOrders(status = null) {
  const url = status 
    ? `${API_BASE_URL}/api/arb/limit-orders?status=${status}`
    : `${API_BASE_URL}/api/arb/limit-orders`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch limit orders');
  return response.json();
}

export async function createLimitOrder(data) {
  const response = await fetch(`${API_BASE_URL}/api/arb/limit-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create limit order');
  }
  return response.json();
}

export async function cancelLimitOrder(orderId) {
  const response = await fetch(`${API_BASE_URL}/api/arb/limit-orders/${orderId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to cancel order');
  return response.json();
}

export async function fetchWalletBalances() {
  const response = await fetch(`${API_BASE_URL}/api/arb/wallet/balances`);
  if (!response.ok) throw new Error('Failed to fetch wallet balances');
  return response.json();
}

export function createWebSocketConnection(onMessage, onError) {
  const wsUrl = API_BASE_URL.replace('http', 'ws');
  const ws = new WebSocket(`${wsUrl}/ws/prices`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  ws.onerror = (error) => {
    if (onError) onError(error);
  };
  
  return ws;
}
