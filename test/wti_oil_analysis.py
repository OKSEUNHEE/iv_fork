"""WTI 원유 선물의 최근 가격과 기술적 지표를 조회한다."""

import pandas as pd
import yfinance as yf


def get_close_prices(ticker: str, period: str = "1y") -> pd.Series:
    """단일 종목 다운로드 결과에서 종가 Series를 안전하게 반환한다."""
    data = yf.download(ticker, period=period, auto_adjust=True, progress=False)
    # 기존 소스는 다운로드 결과 검증 없이 사용해 빈 응답이면 후속 인덱싱 오류가 났다.
    if data.empty or "Close" not in data:
        raise RuntimeError(f"{ticker} 가격 데이터를 가져오지 못했습니다.")

    close = data["Close"]
    # 기존 소스는 종가가 항상 Series라고 가정했다. yfinance 버전에 따라
    # 단일 티커도 한 열 DataFrame으로 반환될 수 있어 Series로 정규화한다.
    if isinstance(close, pd.DataFrame):
        if close.shape[1] != 1:
            raise RuntimeError(f"{ticker}의 종가 열을 하나로 식별할 수 없습니다.")
        close = close.iloc[:, 0]
    return close.dropna()


def main() -> None:
    # 기존 소스에는 oil을 다운로드·정의하는 코드가 없어 NameError가 발생했다.
    oil = get_close_prices("CL=F")
    # 기존 소스는 데이터가 20개 미만일 때 NaN 이동평균을 그대로 출력했다.
    if len(oil) < 20:
        raise RuntimeError("20일 이동평균을 계산할 만큼의 WTI 데이터가 없습니다.")

    oil_ma20 = oil.rolling(20).mean()
    trailing_year = oil.tail(252)

    print(f"최근 종가: ${oil.iloc[-1]:.2f}/배럴")
    print(f"20일 이동평균: ${oil_ma20.iloc[-1]:.2f}/배럴")
    print(f"최근 252거래일 최고: ${trailing_year.max():.2f}")
    print(f"최근 252거래일 최저: ${trailing_year.min():.2f}")


if __name__ == "__main__":
    main()
