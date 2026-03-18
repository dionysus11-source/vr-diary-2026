"""
리밸런싱 기록 데이터 관리
"""
import os
from typing import List, Optional
from datetime import datetime
from models.record import RebalancingRecord


class DataManager:
    """리밸런싱 기록 데이터 매니저"""

    # CSV 파일 경로
    RECORDS_CSV = "data/records.csv"
    INITIAL_PORTFOLIO_CSV = "data/initial_portfolio.csv"

    def __init__(self):
        """데이터 디렉토리 생성"""
        os.makedirs("data", exist_ok=True)

        # CSV 파일 초기화
        self._init_csv_files()

    def _init_csv_files(self):
        """CSV 파일 초기화"""
        # records.csv
        if not os.path.exists(self.RECORDS_CSV):
            with open(self.RECORDS_CSV, 'w', encoding='utf-8') as f:
                f.write("date,price,shares,pool,e_value,v_value,signal,benchmark_shares,benchmark_value,created_at\n")

        # initial_portfolio.csv
        if not os.path.exists(self.INITIAL_PORTFOLIO_CSV):
            with open(self.INITIAL_PORTFOLIO_CSV, 'w', encoding='utf-8') as f:
                f.write("created_at,initial_date,initial_cash,initial_shares,average_price,total_invested\n")

    def save_record(self, record: RebalancingRecord) -> bool:
        """
        리밸런싱 기록 저장

        Args:
            record: 저장할 기록

        Returns:
            성공 여부
        """
        try:
            with open(self.RECORDS_CSV, 'a', encoding='utf-8') as f:
                f.write(record.to_csv_row() + '\n')
            return True
        except Exception as e:
            print(f"❌ 저장 실패: {e}")
            return False

    def load_records(self) -> List[RebalancingRecord]:
        """
        모든 리밸런싱 기록 로드

        Returns:
            기록 리스트 (최신순)
        """
        records = []
        try:
            with open(self.RECORDS_CSV, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # 헤더 건너뛰기
                for line in lines[1:]:
                    if line.strip():
                        records.append(RebalancingRecord.from_csv_row(line))
        except FileNotFoundError:
            pass

        # 최신순 정렬
        records.sort(key=lambda x: x.date, reverse=True)
        return records

    def get_latest_record(self) -> Optional[RebalancingRecord]:
        """
        가장 최신 기록 조회

        Returns:
            최신 기록 또는 None
        """
        records = self.load_records()
        return records[0] if records else None

    def filter_records_by_signal(self, signal: str) -> List[RebalancingRecord]:
        """
        신호별 기록 필터링

        Args:
            signal: BUY/SELL/HOLD

        Returns:
            필터링된 기록 리스트
        """
        records = self.load_records()
        return [r for r in records if r.signal == signal]

    def filter_records_by_date_range(
        self,
        start_date: str,
        end_date: str
    ) -> List[RebalancingRecord]:
        """
        날짜 범위로 기록 필터링

        Args:
            start_date: 시작 날짜 (YYYY-MM-DD)
            end_date: 종료 날짜 (YYYY-MM-DD)

        Returns:
            필터링된 기록 리스트
        """
        records = self.load_records()
        return [r for r in records if start_date <= r.date <= end_date]

    def update_record(
        self,
        index: int,
        record: RebalancingRecord
    ) -> bool:
        """
        기록 수정

        Args:
            index: 수정할 기록 인덱스
            record: 새 기록

        Returns:
            성공 여부
        """
        try:
            records = self.load_records()
            if 0 <= index < len(records):
                records[index] = record
                # 전체 다시 쓰기
                with open(self.RECORDS_CSV, 'w', encoding='utf-8') as f:
                    f.write("date,price,shares,pool,e_value,v_value,signal,benchmark_shares,benchmark_value,created_at\n")
                    for r in records:
                        f.write(r.to_csv_row() + '\n')
                return True
            return False
        except Exception as e:
            print(f"❌ 수정 실패: {e}")
            return False

    def delete_record(self, index: int) -> bool:
        """
        기록 삭제

        Args:
            index: 삭제할 기록 인덱스

        Returns:
            성공 여부
        """
        try:
            records = self.load_records()
            if 0 <= index < len(records):
                deleted_record = records.pop(index)
                # 전체 다시 쓰기
                with open(self.RECORDS_CSV, 'w', encoding='utf-8') as f:
                    f.write("date,price,shares,pool,e_value,v_value,signal,benchmark_shares,benchmark_value,created_at\n")
                    for r in records:
                        f.write(r.to_csv_row() + '\n')
                print(f"✅ {deleted_record.date} 기록이 삭제되었습니다.")
                return True
            return False
        except Exception as e:
            print(f"❌ 삭제 실패: {e}")
            return False

    def clear_all_records(self) -> bool:
        """
        모든 기록 초기화

        Returns:
            성공 여부
        """
        try:
            with open(self.RECORDS_CSV, 'w', encoding='utf-8') as f:
                f.write("date,price,shares,pool,e_value,v_value,signal,benchmark_shares,benchmark_value,created_at\n")
            return True
        except Exception as e:
            print(f"❌ 초기화 실패: {e}")
            return False

    def has_records(self) -> bool:
        """
        기록 존재 여부 확인

        Returns:
            기록이 하나라도 있는지
        """
        return len(self.load_records()) > 0

    def save_initial_portfolio(
        self,
        initial_cash: float,
        initial_shares: int,
        average_price: float,
        initial_date: str = None
    ) -> bool:
        """
        초기 포트폴리오 저장

        Args:
            initial_cash: 초기 현금
            initial_shares: 초기 주식수
            average_price: 평단가
            initial_date: 초기 날짜 (YYYY-MM-DD, 선택사항)

        Returns:
            성공 여부
        """
        try:
            created_at = datetime.now().isoformat()
            if initial_date is None:
                initial_date = datetime.now().strftime('%Y-%m-%d')

            # 총 투자 금액 계산 (현금 + 주식가치)
            total_invested = initial_cash + (initial_shares * average_price)

            with open(self.INITIAL_PORTFOLIO_CSV, 'w', encoding='utf-8') as f:
                f.write("created_at,initial_date,initial_cash,initial_shares,average_price,total_invested\n")
                f.write(f"{created_at},{initial_date},{initial_cash},{initial_shares},{average_price},{total_invested}\n")
            return True
        except Exception as e:
            print(f"❌ 초기 포트폴리오 저장 실패: {e}")
            return False

    def get_initial_portfolio(self) -> Optional[dict]:
        """
        초기 포트폴리오 조회

        Returns:
            초기 포트폴리오 정보 또는 None
        """
        try:
            with open(self.INITIAL_PORTFOLIO_CSV, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if len(lines) > 1:  # 헤더 + 데이터
                    parts = lines[1].strip().split(',')

                    # 이전 데이터 형식 호환성
                    if len(parts) >= 6:
                        return {
                            'created_at': parts[0],
                            'initial_date': parts[1] if len(parts) > 1 else None,
                            'initial_cash': float(parts[2]) if len(parts) > 2 else 0.0,
                            'initial_shares': int(parts[3]) if len(parts) > 3 else 0,
                            'average_price': float(parts[4]) if len(parts) > 4 else 0.0,
                            'total_invested': float(parts[5]) if len(parts) > 5 else 0.0
                        }
                    else:
                        # 이전 형식 (total_invested 없음)
                        total_invested = float(parts[2]) + (int(parts[3]) * float(parts[4]))
                        return {
                            'created_at': parts[0],
                            'initial_date': parts[1] if len(parts) > 1 else None,
                            'initial_cash': float(parts[2]) if len(parts) > 2 else 0.0,
                            'initial_shares': int(parts[3]) if len(parts) > 3 else 0,
                            'average_price': float(parts[4]) if len(parts) > 4 else 0.0,
                            'total_invested': total_invested
                        }
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"❌ 초기 포트폴리오 조회 실패: {e}")
        return None

    def has_initial_portfolio(self) -> bool:
        """
        초기 포트폴리오 설정 여부 확인

        Returns:
            설정되어 있는지
        """
        return self.get_initial_portfolio() is not None
