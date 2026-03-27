# Change: Add Portfolio Modification Feature for Value Rebalancing

## Why
사용자가 주식 분할, 배당금 입금, 혹은 단순 입력 실수 등으로 인해 현재 보유 주식수나 현금(Pool)이 실제 계좌와 다를 때, 이를 손쉽게 수정하여 동기화할 수 있는 기능이 필요합니다.

## What Changes
- "현재 포트폴리오" 카드에 포트폴리오 수정(Edit) 버튼 추가
- 주식수 및 현금(Pool)을 직접 수정할 수 있는 모달 UI 추가
- 수정 시, 가장 최근의 리밸런싱 기록(VRRecord)의 주식수와 현금을 업데이트하는 API 혹은 로직 추가 (필요시 E값과 V값 등 종속 계산값 재계산 또는 현행 유지 여부 결정)
- 프론트엔드 상태 업데이트 및 화면 갱신

## Impact
- Affected specs: value-rebalancing
- Affected code:
  - `components/value-rebalancing/VRPortfolioCard.tsx`
  - `components/value-rebalancing/VRPortfolioEditModal.tsx` (신규)
  - `app/value-rebalancing/page.tsx`
  - `lib/data/vr-storage.ts` 또는 관련 API 엔드포인트
