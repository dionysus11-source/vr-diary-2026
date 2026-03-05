## 1. 데이터 마이그레이션
- [x] 1.1 기존 UTC 기반 날짜를 한국시간 기반으로 변환하는 마이그레이션 스크립트 작성
- [x] 1.2 localStorage에 저장된 기존 데이터 마이그레이션 실행

## 2. 날짜 처리 로직 변경
- [x] 2.1 `lib/data/trades.ts` - `createTrade` 함수에서 한국시간 기준 날짜 생성
- [x] 2.2 `lib/api/stockPrices.ts` - 날짜 필터링 로직을 한국시간 기준으로 변경 (한국시간=미국시간 1:1 매칭)
- [x] 2.3 `app/api/stock-prices/route.ts` - API 응답 날짜를 한국시간 기준으로 변환

## 3. 차트 컴포넌트 수정
- [x] 3.1 `components/charts/RoundTimeSeriesProfitChart.tsx` - 날짜 매칭 로직을 한국시간 기준으로 변경
- [x] 3.2 차트의 X축 날짜 표시를 한국시간 기준으로 변경
- [x] 3.3 Legend 제거 및 Y축 라벨 수정

## 4. UI/UX 업데이트
- [x] 4.1 날짜 입력 필드에 한국시간 기준임을 힌트로 표시
- [x] 4.2 차트 tooltip에 한국시간 기준 날짜 표시
- [x] 4.3 자정 기준 캐시 만료 기능 추가

## 5. 버그 수정
- [x] 5.1 진행중 회차 currentPrice 자동 업데이트
- [x] 5.2 exportToCSV 함수 수정 (구버전 속성 참조)

## 6. 테스트
- [x] 6.1 한국시간 날짜 매칭 동작 확인
- [x] 6.2 종가 데이터 정확성 확인
