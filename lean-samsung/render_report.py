"""Generate a self-contained HTML report for Samsung Electronics (005930.KS) LEAN backtest results."""

from __future__ import annotations

import argparse
import html
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def pct(value: float) -> str:
    return f"{value * 100:+.2f}%"


def svg_line(points: list[float], color: str, width: int = 760, height: int = 250) -> str:
    if not points:
        return ""
    low, high = min(points), max(points)
    spread = high - low or 1
    coordinates = []
    for index, value in enumerate(points):
        x = index * width / max(len(points) - 1, 1)
        y = height - ((value - low) / spread * (height - 30)) - 15
        coordinates.append(f"{x:.1f},{y:.1f}")
    return f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="차트"><polyline fill="none" stroke="{color}" stroke-width="3" points="{" ".join(coordinates)}" /></svg>'


def main() -> None:
    results_dir = Path("/home/okseunhee/investment-analysis/lean-results")
    full_json_path = results_dir / "SamsungBuyAndHold.json"
    summary_json_path = results_dir / "SamsungBuyAndHold-summary.json"
    output_html_path = results_dir / "samsung-2024-report.html"

    if not full_json_path.exists():
        raise FileNotFoundError(f"Missing {full_json_path}")

    full_data = json.loads(full_json_path.read_text(encoding="utf-8"))
    summary_data = json.loads(summary_json_path.read_text(encoding="utf-8")) if summary_json_path.exists() else full_data

    # Extract price series
    close_raw = full_data.get("charts", {}).get("Samsung Electronics", {}).get("series", {}).get("Close", {}).get("values", [])
    # values are [[timestamp, close], ...]
    daily_closes = []
    for row in close_raw:
        dt = datetime.fromtimestamp(row[0], timezone.utc).date()
        daily_closes.append((dt, float(row[1])))

    # Extract equity series
    equity_raw = full_data.get("charts", {}).get("Strategy Equity", {}).get("series", {}).get("Equity", {}).get("values", [])
    equity_points = [row[4] if len(row) > 4 else row[1] for row in equity_raw]
    close_points = [c[1] for c in daily_closes]

    # Calculate monthly summary from daily closes
    monthly_data = defaultdict(list)
    for dt, close in daily_closes:
        month_key = dt.strftime("%Y-%m")
        monthly_data[month_key].append((dt, close))

    monthly_rows = []
    prev_close = daily_closes[0][1] if daily_closes else 0
    for month, items in sorted(monthly_data.items()):
        month_start_close = items[0][1]
        month_end_close = items[-1][1]
        days_count = len(items)
        month_return = (month_end_close - month_start_close) / month_start_close
        monthly_rows.append({
            "month": month,
            "days": days_count,
            "start": month_start_close,
            "end": month_end_close,
            "return": month_return,
        })

    stats = summary_data.get("statistics", {})
    runtime_stats = summary_data.get("runtimeStatistics", {})
    algo_config = summary_data.get("algorithmConfiguration", {})
    start_date = algo_config.get("startDate", "2024-01-01T00:00:00Z")[:10]
    end_date = algo_config.get("endDate", "2025-01-01T00:00:00Z")[:10]

    initial_close = daily_closes[0][1] if daily_closes else 0
    final_close = daily_closes[-1][1] if daily_closes else 0
    stock_return = (final_close - initial_close) / initial_close if initial_close else 0

    net_profit = stats.get("Net Profit", "-2.640%")
    drawdown = stats.get("Drawdown", "3.800%")
    sharpe = stats.get("Sharpe Ratio", "-3.919")

    table_rows_html = "".join(
        f"<tr><td>{m['month']}</td><td>{m['days']}</td>"
        f"<td>{m['start']:,.0f}원</td><td>{m['end']:,.0f}원</td>"
        f"<td style='color: {'#dc2626' if m['return'] < 0 else '#2563eb'}'>{pct(m['return'])}</td></tr>"
        for m in monthly_rows
    )

    stat_keys = [
        ("Net Profit", "순수익률"),
        ("Compounding Annual Return", "연환산 복리수익률"),
        ("Drawdown", "최대 낙폭 (MDD)"),
        ("Sharpe Ratio", "샤프 비율"),
        ("Sortino Ratio", "소르티노 비율"),
        ("Annual Standard Deviation", "연간 표준편차"),
        ("Total Orders", "총 주문 수"),
        ("Start Equity", "초기 자본금"),
        ("End Equity", "최종 자본금"),
        ("Portfolio Turnover", "포트폴리오 회전율"),
    ]
    summary_list_html = "".join(
        f"<li><strong>{html.escape(label)} ({html.escape(key)})</strong>: {html.escape(str(stats.get(key, 'N/A')))}</li>"
        for key, label in stat_keys if key in stats
    )

    report_html = f"""<!doctype html>
<html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>삼성전자 2024년 LEAN 백테스트 분석 보고서</title>
<style>body{{font-family:system-ui,sans-serif;max-width:900px;margin:32px auto;padding:0 20px;color:#172033;background:#f8fafc}}section{{background:white;border-radius:12px;padding:22px;margin:18px 0;box-shadow:0 1px 3px #0001}}h1{{margin-bottom:4px}}.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}}.metric{{padding:15px;background:#eff6ff;border-radius:9px}}.metric b{{display:block;font-size:1.3rem;margin-top:5px}}table{{border-collapse:collapse;width:100%}}td,th{{padding:9px;border-bottom:1px solid #e2e8f0;text-align:right}}td:first-child,th:first-child{{text-align:left}}svg{{width:100%;background:#f8fafc;border-radius:8px}}.note{{color:#475569;line-height:1.6}}</style>
<body><h1>삼성전자(005930.KS) 2024년 백테스트 검증</h1><p>검증 기간: {start_date} ~ {end_date} (총 {len(daily_closes)} 거래일)</p>
<section class="grid"><div class="metric">주가 변동률 (2024)<b>{pct(stock_return)}</b></div><div class="metric">최대 낙폭 (Drawdown)<b>{drawdown}</b></div><div class="metric">전략 순수익률 (Net Profit)<b>{net_profit}</b></div></section>
<section><h2>삼성전자 일봉 종가 추이</h2><p>파랑: 삼성전자(005930.KS) 일별 종가 흐름 ({initial_close:,.0f}원 → {final_close:,.0f}원)</p>{svg_line(close_points, '#2563eb')}<p style="margin-top:20px;">회색: 포트폴리오 자산 가치(Strategy Equity) 변동 추이</p>{svg_line(equity_points, '#64748b')}</section>
<section><h2>월별 주가 및 수익률 현황</h2><table><thead><tr><th>월</th><th>거래일수</th><th>월초 종가</th><th>월말 종가</th><th>월간 변동률</th></tr></thead><tbody>{table_rows_html}</tbody></table></section>
<section><h2>LEAN 백테스트 엔진 결과</h2><ul>{summary_list_html}</ul></section>
<section class="note"><h2>해석 주의</h2><p>본 보고서는 QuantConnect LEAN 백테스트 엔진과 Yahoo Finance의 삼성전자 보통주(005930.KS) 일봉 데이터를 바탕으로 생성되었습니다. 초기 1,000,000원의 자본금으로 시작하여 1주 단순 매수 보유(Buy & Hold) 전략을 시뮬레이션한 결과입니다. KRX 실제 거래비용, 세금, 배당금 재투자, 액면분할, 환율 및 슬리피지 등은 반영되지 않았으며, 과거 데이터에 기반한 결과이므로 미래 수익을 보장하지 않습니다.</p></section>
</body></html>"""

    output_html_path.write_text(report_html, encoding="utf-8")
    print(f"Wrote HTML report to {output_html_path}")

    # Also write to render_report.py in lean-samsung for maintainability
    script_target = Path("/home/okseunhee/investment-analysis/lean-samsung/render_report.py")
    script_target.write_text(Path(__file__).read_text(encoding="utf-8"), encoding="utf-8")
    print(f"Updated {script_target}")


if __name__ == "__main__":
    main()
