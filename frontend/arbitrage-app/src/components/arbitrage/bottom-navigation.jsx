import { Home, TrendingUp, BarChart3, Users, Wallet } from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "HOME", active: false },
  { icon: TrendingUp, label: "TRADE", active: false },
  { icon: BarChart3, label: "ARB", active: true },
  { icon: Users, label: "FOLLOW", active: false },
  { icon: Wallet, label: "WALLET", active: false },
];

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
      <div className="flex justify-around items-center py-2 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              item.active
                ? "text-yellow-400"
                : "hover:text-foreground"
            }`}
            style={{ color: item.active ? "var(--arb-yellow)" : "var(--muted-foreground)" }}
          >
            <div className={`p-1.5 rounded ${item.active ? "bg-yellow-500/20" : ""}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
