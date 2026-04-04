import { Zap } from "lucide-react";

export function ExecuteButton({ onExecute, isExecuting, disabled }) {
  return (
    <button
      onClick={onExecute}
      disabled={disabled || isExecuting}
      className="w-full h-14 font-bold text-lg rounded-lg transition-all glow-yellow disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: "var(--arb-yellow)",
        color: "var(--background)"
      }}
    >
      {isExecuting ? (
        <>
          <div className="inline-block w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mr-2" style={{ borderColor: "var(--background)" }} />
          EXECUTING...
        </>
      ) : (
        <>
          <Zap className="inline-block w-5 h-5 mr-2" />
          EXECUTE ARBITRAGE
        </>
      )}
    </button>
  );
}
