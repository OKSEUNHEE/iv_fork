"""원/달러 환율과 한국 주식 ETF의 가격 상관관계를 계산한다."""

import pandas as pd
import yfinance as yf


def get_close_prices(ticker: str, start: str, end: str) -> pd.Series:
    """단일 티커의 조정 종가를 반환하고 빈 응답을 명확히 알린다."""
    data = yf.download(
        ticker, start=start, end=end, auto_adjust=True, progress=False
    )
    # 기존 소스는 빈 응답에서도 "Close"를 바로 선택해 KeyError가 날 수 있었다.
    if data.empty or "Close" not in data:
        raise RuntimeError(f"{ticker} 가격 데이터를 가져오지 못했습니다.")

    close = data["Close"]
    # yfinance가 반환하는 한 열 DataFrame을 Series로 정규화한다.
    # 그렇지 않으면 DataFrame 생성 및 상관계수 계산 결과가 의도와 달라질 수 있다.
    if isinstance(close, pd.DataFrame):
        if close.shape[1] != 1:
            raise RuntimeError(f"{ticker}의 종가 열을 하나로 식별할 수 없습니다.")
        close = close.iloc[:, 0]
    return close.rename(ticker).dropna()


def main() -> None:
    usdkrw = get_close_prices("KRW=X", "2022-01-01", "2025-12-31")
    kospi = get_close_prices("EWY", "2022-01-01", "2025-12-31")
    prices = pd.concat([usdkrw.rename("환율"), kospi.rename("코스피ETF")], axis=1).dropna()

    # 기존 소스는 공통 거래일이 부족한 경우의 상관계수 계산을 검증하지 않았다.
    if len(prices) < 2:
        raise RuntimeError("상관계수를 계산할 공통 거래일 데이터가 부족합니다.")

    correlation = prices["환율"].corr(prices["코스피ETF"])
    print(f"원달러 환율 vs 코스피ETF 상관계수: {correlation:.3f}")
    print("(음수: 환율 상승 시 코스피 ETF 하락 경향)")


if __name__ == "__main__":
    main()
