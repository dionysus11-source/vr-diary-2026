# Change: Add Data Reset Functionality

## Why
사용자가 테스트를 마치고 모든 기록을 초기화할 수 있는 기능이 필요합니다. 현재는 CSV 파일을 수동으로 삭제해야 하는데, 이는 불편하고 위험할 수 있습니다.

## What Changes
- 데이터 초기화 메뉴 추가 (메뉴 6, 종료는 7로 변경)
- 이중 확인 절차 구현
- CSV 파일 백업 기능 (선택사항)
- 초기화 전 경고 메시지

## Impact
- Affected specs: exchange-rate-tracker (MODIFIED)
- Affected code: scripts/exchange_rate_tracker/exchange_rate_tracker.py
- UI: 메뉴 번호 변경 (종료: 5 → 7)
