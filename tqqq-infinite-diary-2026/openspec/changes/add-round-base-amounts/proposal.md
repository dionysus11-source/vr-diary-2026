# Change: 회차에 총 투자 원금(Seed) 및 1회 매수 시도액(Try Amount) 입력 항목 추가

## Why
현재는 V2.2 가이드를 제공할 때 '해당 회차의 첫 매수액'을 자동으로 1회 매수 시도액으로 간주하여 T값을 도출하고 있습니다. 하지만 사용자가 원금에 맞춰 명시적으로 1회 매수 시도액과 총 투자금(Seed)을 설정하고 싶어합니다. 
새로운 회차를 만들 때 이 값들을 명확히 입력받고, 이미 생성된 회차에서도 이를 보여주며, 수정할 수 있는 편집 기능이 제공되어야 정확하고 유연한 V2.2 가이드와 계산을 지원할 수 있습니다.

## What Changes
- 데이터 모델(`Round` 타입)에 `totalSeedAmount`(총 투자 원금) 및 `tryAmount`(1회 매수 시도액) 필드 추가 (선택적 또는 기본값 지원).
- 새 회차 시작 모달(`NewRoundModal`)에 두 입력 필드를 추가하여 회차 생성 시 입력받음.
- 회차 상세 모달(`RoundDetailModal`)의 "Basic Info" 영역에 두 값을 표시.
- 회차 상세 모달 하단에 "설정 편집" 버튼을 추가하고 누르면 두 값을 수정할 수 있는 `EditRoundSettingsModal` 기능을 제공.
- V2.2 가이드 유틸리티(`v22-guide.ts`)에서 T값을 구할 때, 사용자가 명시한 `tryAmount`가 있다면 이를 최우선으로 적용하도록 개선.

## Impact
- Affected specs: `infinite-buying-analytics`
- Affected code: `types/index.ts`, `lib/data/trades.ts`, `components/ui/NewRoundModal.tsx`, `components/ui/RoundDetailModal.tsx`, `components/ui/EditRoundSettingsModal.tsx`(신규), `lib/calculations/v22-guide.ts`, `app/page.tsx`
