"""반도체 관련 종목의 1년 누적 수익률을 CSV와 이미지로 저장한다."""

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import yfinance as yf


TICKERS = {
    "Samsung Electronics": "005930.KS",
    "SK Hynix": "000660.KS",
    "NVIDIA": "NVDA",
    "Intel": "INTC",
    "TSMC ADR": "TSM",
    "SOXX ETF": "SOXX",
}
OUTPUT_DIR = Path(__file__).parent


def fetch_prices(tickers: dict[str, str], period: str = "1y") -> pd.DataFrame:
    """성공적으로 받은 종가만 결합한다."""
    prices: dict[str, pd.Series] = {}
    for name, ticker in tickers.items():
        data = yf.download(ticker, period=period, auto_adjust=True, progress=False)
        # 기존 소스는 빈 응답 또는 Close 열 누락 시 후속 처리에서 오류가 날 수 있었다.
        if data.empty or "Close" not in data:
            print(f"skip: {name} ({ticker})")
            continue

        close = data["Close"]
        # yfinance 버전에 따라 단일 티커의 Close가 DataFrame일 수 있어 Series로 통일한다.
        if isinstance(close, pd.DataFrame):
            if close.shape[1] != 1:
                print(f"skip: {name} ({ticker}, ambiguous close columns)")
                continue
            close = close.iloc[:, 0]
        prices[name] = close.rename(name)

    if not prices:
        # 기존 소스는 모든 다운로드가 실패하면 빈 DataFrame으로 뒤의 iloc[0]을 호출했다.
        raise RuntimeError("가격 데이터를 가져온 종목이 없습니다.")
    return pd.DataFrame(prices).sort_index().dropna(how="all")


def main() -> None:
    prices = fetch_prices(TICKERS)
    # 기존 prices.iloc[0] 방식은 종목별 상장일·휴장일 차이로 첫 값이 NaN일 때
    # 해당 종목 전체 수익률을 NaN으로 만들었다. 각 열의 최초 유효 종가를 기준으로 계산한다.
    first_prices = prices.apply(lambda column: column.dropna().iloc[0])
    returns = prices.divide(first_prices).subtract(1).multiply(100)

    # 기존에는 실행 위치에 따라 CSV/이미지가 다른 디렉터리에 저장됐다.
    prices.to_csv(OUTPUT_DIR / "industry_prices.csv", encoding="utf-8-sig")

    plt.figure(figsize=(12, 6))
    for column in returns.columns:
        plt.plot(returns.index, returns[column], label=column, linewidth=1.4)

    plt.axhline(0, color="black", linewidth=0.7, linestyle="--")
    plt.title("Semiconductor Industry: 1Y Cumulative Return")
    plt.ylabel("Return (%)")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "industry_price_return.png", dpi=150, bbox_inches="tight")
    plt.close()


if __name__ == "__main__":
    main()
