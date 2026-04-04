export function AccountBalances({ accountBalance, currentBalance }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="flex justify-between items-start py-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>
          Account Balance
        </p>
        <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          <span style={{ color: "var(--arb-yellow)" }}>ZAR</span>{" "}
          {formatCurrency(accountBalance)}
        </p>
      </div>
      
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>
          Current Balance
        </p>
        <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          <span style={{ color: "var(--arb-cyan)" }}>ZAR</span>{" "}
          {formatCurrency(currentBalance)}
        </p>
      </div>
    </div>
  );
}
