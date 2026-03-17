# Change: Add Color Output and Fix Profit Calculation

## Why
1. **이익/손실 시각화**: 이익(녹색)과 손실(빨간색)을 색상으로 구분하여 직관적인 인터페이스 제공
2. **재환전 계산 버그 수정**: 사용한 달러가 있는 경우, "총 투자 원화"가 아닌 "현재 보유 달러의 원화 가치"를 기준으로 이익/손실 계산

## What Changes
- **BREAKING**: 재환전 이익 계산 로직 수정 (현재 보유 달러의 원화 가치 기준)
- 콘솔 색상 출력 기능 추가 (ANSI color codes)
- [IN] 태그 녹색, [OUT] 태그 빨간색
- 이익 시 녹색, 손실 시 빨간색 표시
- Windows 10+ ANSI 색상 지원

## Impact
- Affected specs: exchange-rate-tracker (MODIFIED)
- Affected code: scripts/exchange_rate_tracker/exchange_rate_tracker.py
- Calculation fix: 이익 계산이 "총 투자 원화" 기준 → "현재 보유 달러의 원화 가치" 기준으로 변경
