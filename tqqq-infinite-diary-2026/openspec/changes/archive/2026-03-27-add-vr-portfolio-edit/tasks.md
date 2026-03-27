## 1. 프론트엔드 UI 컴포넌트
- [ ] 1.1 `components/value-rebalancing/VRPortfolioEditModal.tsx` 생성
  - 주식수, 현금(Pool) 입력 폼 (소수점 지원) 포함
- [ ] 1.2 `components/value-rebalancing/VRPortfolioCard.tsx` 모디파이
  - 우측 상단이나 하단에 "수정" 버튼 추가
  - 모달 on/off 상태 관리 추가 또는 부모로 이벤트 위임
- [ ] 1.3 `app/value-rebalancing/page.tsx` 연동
  - `VRPortfolioEditModal` 렌더링
  - 포트폴리오 카드 컴포넌트에 모달 호출 함수 전달 및 콜백 (새로고침) 연동

## 2. API 및 백엔드 로직 연동
- [ ] 2.1 `lib/data/vr-storage.ts` 또는 현재 사용 API 로직에서 최신 `VRRecord` 업데이트 로직 추가
  - `updateLatestRecordInfo(shares, pool)` 함수 추가
  - 최신 기록 정보(주식수 및 현금) 수정
- [ ] 2.2 API Route (필요시)
  - `/api/value-rebalancing/records/latest/route.ts` (또는 기존 업데이트 라우트 활용) 등 수정된 레코드를 서버 DB에 저장

## 3. 검증 (Validation)
- [ ] 3.1 로컬에서 V값 수정 팝업이 뜨고 주식수/현금이 제대로 데이터베이스 및 화면에 최신화되는지 확인
- [ ] 3.2 이전 기록의 V값/기타 정보나 다른 차수 기록에 영향을 미치지 않는지 확인
