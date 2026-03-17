# Change: Exchange Rate Tracker

## Why
현재 개인적으로 환전 기록을 관리할 수 있는 도구가 없어, 언제 어떤 환율로 달러를 환전했는지 추적하기 어렵습니다. 평균 환율과 총 환전 금액을 한눈에 파악하고, 특정 환율에서 재환전 시 이익을 계산할 수 있는 도구가 필요합니다.

## What Changes
- 환율 기록 및 관리를 위한 파이썬 콘솔 프로그램 추가
- CSV 파일을 통한 데이터 영구 저장
- 총 환전 금액 및 평균 환율 계산 기능
- 특정 환율에서 재환전 시 이익/손실 계산 기능
- 사용자 친화적인 콘솔 인터페이스

## Impact
- Affected specs: 새로운 capability 추가 (exchange-rate-tracker)
- Affected code: 새로운 파이썬 모듈 추가 (scripts/exchange_rate_tracker.py)
- Data: CSV 파일 생성 (exchange_records.csv)
