# Change: 한국시간 기반 날짜 매칭으로 변경

## Why

현재 시스템은 UTC 기준으로 날짜를 저장하고 처리하여, 한국 사용자가 입력한 날짜와 미국 시장 종가 날짜가 불일치하는 문제가 있습니다. 한국 사용자가 3월 5일에 입력하면 미국 3월 5일 종가와 매칭되어야 합니다.

## What Changes

- **BREAKING**: 날짜 입력/저장 시 UTC 기준에서 한국시간(KST) 기준으로 변경
- 거래 입력 날짜를 한국시간 자정 기준으로 처리하도록 수정
- 종가 데이터 매칭 로직을 한국시간 날짜 = 미국 시장 날짜 (1:1 매칭)으로 변경
- 시계열 차트의 날짜 표시를 한국시간 기준으로 변경

## Impact

- Affected specs: `infinite-buying-analytics`
- Affected code:
  - `lib/data/trades.ts` - 날짜 저장 로직
  - `lib/api/stockPrices.ts` - 종가 데이터 매칭 로직 (한국시간=미국시간 1:1)
  - `components/charts/RoundTimeSeriesProfitChart.tsx` - 차트 날짜 처리
  - `app/api/stock-prices/route.ts` - API 응답 날짜 처리

## Migration Plan

1. 기존 데이터 마이그레이션: UTC 날짜 → 한국시간 날짜 변환
2. 날짜 처리 로직 전체를 KST 기준으로 변경
3. UI 표시 로직도 KST 기준으로 업데이트
