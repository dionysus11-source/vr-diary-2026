# Change: 차트 뷰 토글 기능 추가

## Why

현재 시계열 수익률 차트에 종가, 평단가, 수익률을 동시에 표시하여 Y축이 두 개(가격, 수익률)가 있고 그래프가 복잡합니다. 또한 이전 변경으로 Legend를 제거했어서 사용자가 각 선이 무엇을 의미하는지 알기 어렵습니다. 사용자가 필요에 따라 수익률 뷰와 가격(종가/평단가) 뷰를 선택해서 볼 수 있도록 토글 기능을 추가해야 합니다.

## What Changes

- 차트 상단에 뷰 전환 토글 버튼 추가 (수익률 / 가격)
- **수익률 뷰**: 수익률 영역 차트만 표시, Y축은 수익률(%)
- **가격 뷰**: 종가, 평단가 선만 표시, Y축은 가격($)
- 선택된 뷰에 따라 tooltip 내용도 변경
- Legend를 다시 표시하여 각 선의 의미를 명확히 표시

## Impact

- Affected specs: `infinite-buying-analytics`
- Affected code:
  - `components/charts/RoundTimeSeriesProfitChart.tsx` - 뷰 토글 상태 및 렌더링 로직 추가
  - Legend 컴포넌트 재추가

## Migration Plan

없음 (새로운 기능 추가)
