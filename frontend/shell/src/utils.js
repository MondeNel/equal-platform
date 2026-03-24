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

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "MORNING";
  if (h < 17) return "AFTERNOON";
  return "EVENING";
}