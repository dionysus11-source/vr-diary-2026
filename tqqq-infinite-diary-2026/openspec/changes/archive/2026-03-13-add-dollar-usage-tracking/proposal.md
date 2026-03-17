# Change: Add Dollar Usage Tracking

## Why
현재 환율 추적 프로그램은 원화 → 달러 환전 기록만 관리합니다. 하지만 실제로는 보유 달러를 주식 매수, ETF 구매 등 다양한 용도로 사용합니다. 달러 사용을 기록하지 않으면 실제 보유 달러와 계산상의 보유 달러가 달라져 재환전 이익 계산이 부정확해집니다.

## What Changes
- 달러 사용 기록 추가 기능 (사용 용도, 금액, 메모)
- 보유 달어에서 사용 금액 차감
- 전체 기록 보기에 환전/사용 구분 표시
- 통계에서 실제 보유 달러 정확히 계산
- 재환전 이익 계산 시 현재 보유 달러만 고려
- **중요: 평균 환율은 변하지 않음 (투자 원화 ÷ 총 환전 금액으로 계산)**

## Impact
- Affected specs: exchange-rate-tracker (MODIFIED)
- Affected code: scripts/exchange_rate_tracker/exchange_rate_tracker.py
- Data: CSV 파일에 usage_type, purpose 필드 추가
