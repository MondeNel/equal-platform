import anthropic
import os
from decimal import Decimal
from typing import Optional

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

PETER_SYSTEM = """You are Peter, an expert AI trading analyst for the eQual platform.
You analyse financial markets and provide clear, concise trading recommendations.

Your analysis must always include:
1. A brief market assessment (2-3 sentences)
2. A clear directional bias (bullish/bearish)
3. Specific recommended ENTRY, TAKE PROFIT, and STOP LOSS levels
4. Risk/reward ratio

Keep your response under 150 words. Be direct and actionable.
Always end with the recommended levels in this exact format:
ENTRY: [price]
TP: [price]
SL: [price]
R/R: [ratio]"""


async def analyse(
    symbol: str,
    price: float,
    direction: Optional[str] = None,
    entry: Optional[float] = None,
    tp: Optional[float] = None,
    sl: Optional[float] = None,
    analysis_type: str = "TREND",
) -> dict:
    prompt = f"""Analyse {symbol} at current price {price}.
Analysis type: {analysis_type}
{"Direction bias: " + direction if direction else ""}
{"Current setup - Entry: " + str(entry) + " TP: " + str(tp) + " SL: " + str(sl) if entry else ""}

Provide your analysis and recommended trade levels."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=PETER_SYSTEM,
            messages=[{"role": "user", "content": prompt}]
        )

        text = message.content[0].text

        # Parse recommended levels from response
        recommended = {"entry": None, "tp": None, "sl": None, "rr": None}
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("ENTRY:"):
                try:
                    recommended["entry"] = float(line.split(":")[1].strip().replace(",", ""))
                except:
                    pass
            elif line.startswith("TP:"):
                try:
                    recommended["tp"] = float(line.split(":")[1].strip().replace(",", ""))
                except:
                    pass
            elif line.startswith("SL:"):
                try:
                    recommended["sl"] = float(line.split(":")[1].strip().replace(",", ""))
                except:
                    pass
            elif line.startswith("R/R:"):
                try:
                    recommended["rr"] = line.split(":")[1].strip()
                except:
                    pass

        return {
            "analysis": text,
            "recommended": recommended,
            "symbol": symbol,
            "price": price,
        }

    except Exception as e:
        return {
            "analysis": f"Peter is unavailable right now. Please try again shortly.",
            "recommended": {"entry": price, "tp": None, "sl": None, "rr": None},
            "symbol": symbol,
            "price": price,
            "error": str(e),
        }