# Change: 시계열 수익률 추적으로 회차별 수익률 차트 대체

## Why

회차별 수익률 차트는 각 회차의 최종 수익률만 보여주어 시간의 흐름에 따른 수익률 변화 추이를 파악하기 어렵습니다. 대신 회차를 클릭했을 때 해당 회차의 시간대별 수익률 변화를 보여주면, 사용자가 매수/매도 시점별 수익률 변화를 더 상세하게 분석할 수 있습니다. 특히 분할 매수/매도가 있는 경우 각 거래 시점에서의 수익률 변화를 추적하는 것이 투자 전략 개선에 더 유용합니다.

## What Changes

- **REMOVED** 회차별 수익률 시각화 (각 회차의 최종 수익률만 보여주는 선 그래프)
- **ADDED** 주식 종가 데이터 가져오기 (외부 API 연동)
  - Yahoo Finance API 또는 Alpha Vantage API를 통한 일별 종가 데이터 수집
  - TQQQ, SOXL 등 관리 종목의 과거/실시간 가격 데이터 자동 가져오기
- **ADDED** 회차 상세 모달 내 시계열 수익률 차트 (해당 회차의 시간대별 수익률 변화)
  - 매수일부터 현재(진행중) 또는 최종 매도일(완료)까지의 **매일 종가 기반** 수익률 추이
  - 각 매수/매도 시점에서의 수익률 포인트 표시
  - 진행중 회차는 실시간 종가로 자동 업데이트

## Impact

- Affected specs: `infinite-buying-analytics`
- Affected code:
  - `components/charts/ProfitLossChart.tsx` (제거)
  - `lib/api/stockPrices.ts` (신규 - API 연동)
  - `components/charts/RoundTimeSeriesProfitChart.tsx` (신규)
  - `app/page.tsx` (차트 컴포넌트 교체)
  - `components/ui/RoundDetailModal.tsx` (시계열 차트 추가)
- External dependencies: Yahoo Finance API 또는 Alpha Vantage API (무료 티어)
