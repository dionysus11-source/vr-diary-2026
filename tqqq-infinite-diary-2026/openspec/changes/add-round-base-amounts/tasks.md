## 1. Data Model
- [x] 1.1 `types/index.ts`의 `Round`에 `totalSeedAmount?: number` 및 `tryAmount?: number` 추가
- [x] 1.2 `lib/data/trades.ts`의 `createRound` 시그니처 수정하여 두 값 저장

## 2. UI - New Round
- [x] 2.1 `NewRoundModal`에 총 시드, 1회 매수 시도액 입력 필드 추가
- [x] 2.2 `app/page.tsx`의 `handleCreateRound` 수정

## 3. UI - Round Detail
- [x] 3.1 `RoundDetailModal`의 Basic Info에 총 시드, 1회 매수 시도액 표시
- [x] 3.2 `EditRoundSettingsModal` 컴포넌트 신규 작성 (시드, 1회 매수액 수정 폼)
- [x] 3.3 `RoundDetailModal`에 "설정 편집" 버튼 추가 및 `app/page.tsx`에 핸들러 연동

## 4. Logic Update
- [x] 4.1 `lib/calculations/v22-guide.ts` 업데이트 (명시된 tryAmount 우선 활용, 없으면 fallback)
