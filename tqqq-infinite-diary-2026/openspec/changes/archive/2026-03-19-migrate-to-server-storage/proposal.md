# Change: 서버 측 데이터 저장소 이관 (Migrate to Server Storage)

## Why
현재 무한매수 및 밸류리밸런싱 데이터가 브라우저의 localStorage에 저장되어 있어, 다른 기기나 브라우저 환경에서 접속할 때 동일한 투자 일지 데이터를 확인할 수 없는 불편함이 있습니다. 사용자 경험을 개선하고 데이터의 안정적인 보존을 위해 물리적 기기 종속성을 제거하고 서버(DB)에 저장하여 어디서든 일관된 값을 보도록 변경해야 합니다.

## What Changes
- 클라이언트(브라우저) 환경에서 관리되던 핵심 데이터 스토리지 계층을 서버 API 호출 기반으로 변경합니다.
- 데이터의 보호 및 식별을 위해 사용자 인증(Authentication) 시스템 또는 최소한의 계정 식별 체계를 도입합니다.
- 무한매수 기록(infinite-buying-analytics)의 데이터 저장 방식을 서버 DB 기준으로 마이그레이션합니다.
- 밸류리밸런싱(value-rebalancing)의 데이터 저장 방식 역시 서버 DB 기준으로 마이그레이션합니다.
- **개별 도메인(무한매수, 밸류리밸런싱)별로 제공되던 백업/복원 기능에 더해, 시스템 '전체 데이터'를 한 번에 백업하고 복원할 수 있는 통합 데이터 관리(Data Management) 기능을 추가합니다.**
- 단순 UI 뷰포트 상태나 다크 모드 같은 환경설정 요소는 기존처럼 localStorage를 유지하더라도, 일지/투자 기록 등 비즈니스 데이터는 모두 영속화 데이터베이스(Persistence)로 교체합니다.

## Impact
- Affected specs: infinite-buying-analytics, value-rebalancing, data-management (신규)
- Affected code: Data Fetching Hooks, Backend API layer, Database Schema
