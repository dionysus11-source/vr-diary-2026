"""
차수별 매수/매도 기록 관리
"""
import os
import csv
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from models.record import RebalancingRecord


@dataclass
class RoundTransaction:
    """차수 매수/매도 기록"""
    round_id: str
    date: str
    transaction_type: str  # BUY, SELL
    shares: int
    price: float
    total_amount: float
    shares_after: int
    pool_after: float
    notes: str = ""


@dataclass
class RoundInfo:
    """차수 정보"""
    round_id: str
    start_date: str
    end_date: str
    initial_shares: int
    initial_pool: float
    final_shares: int
    final_pool: float
    shares_change: int  # 최종 - 초기
    pool_change: float  # 최종 - 초기
    transactions: List[RoundTransaction]


class RoundManager:
    """차수 관리자"""

    def __init__(self):
        """초기화"""
        self.data_dir = "data"
        os.makedirs(self.data_dir, exist_ok=True)
        self.rounds_csv = os.path.join(self.data_dir, "rounds.csv")
        self.transactions_csv = os.path.join(self.data_dir, "round_transactions.csv")
        self._init_csv_files()

    def _init_csv_files(self):
        """CSV 파일 초기화"""
        # rounds.csv
        if not os.path.exists(self.rounds_csv):
            with open(self.rounds_csv, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'round_id', 'start_date', 'end_date',
                    'initial_shares', 'initial_pool',
                    'final_shares', 'final_pool',
                    'shares_change', 'pool_change',
                    'created_at'
                ])

        # round_transactions.csv
        if not os.path.exists(self.transactions_csv):
            with open(self.transactions_csv, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'round_id', 'date', 'transaction_type',
                    'shares', 'price', 'total_amount',
                    'shares_after', 'pool_after', 'notes',
                    'created_at'
                ])

    def calculate_round_period(self, record_date: str, first_record_date: str) -> tuple:
        """
        차수 기간 계산 (첫 번째 기록 날짜를 기준으로 2주 단위)

        Args:
            record_date: 기준 날짜 (YYYY-MM-DD)
            first_record_date: 첫 번째 기록 날짜

        Returns:
            (start_date, end_date, round_number)
        """
        # 첫 번째 기록 날짜를 기준으로 계산
        first_record = datetime.strptime(first_record_date, '%Y-%m-%d')

        # 첫 번째 차수 시작일: 기록일 + 3일 (월요일)
        first_round_start = first_record + timedelta(days=3)

        # 거래 날짜
        trans_date = datetime.strptime(record_date, '%Y-%m-%d')

        # 첫 번째 차수 종료일
        first_round_end = first_round_start + timedelta(days=11)

        # 거래일이 첫 번째 차수 범위 내인지 확인
        if trans_date <= first_round_end:
            round_number = 1
            start_date = first_round_start
            end_date = first_round_end
        else:
            # 첫 번째 차수 이후: 몇 번째 차수인지 계산
            days_from_first_end = (trans_date - first_round_end).days
            round_number = (days_from_first_end // 14) + 2

            # 해당 차수의 시작일과 종료일
            start_date = first_round_start + timedelta(days=(round_number - 1) * 14)
            end_date = start_date + timedelta(days=11)

        return start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'), round_number

    def get_round_id(self, record_date: str, first_record_date: str) -> str:
        """
        차수 ID 생성 (첫 번째 기록 날짜를 기준으로 단순 번호)
        형식: N차수 (예: 1차수, 2차수, 3차수)

        Args:
            record_date: 기록 날짜
            first_record_date: 첫 번째 기록 날짜 (records.csv의 첫 날짜)

        Returns:
            차수 ID (단순 번호)
        """
        first_record = datetime.strptime(first_record_date, '%Y-%m-%d')

        # 첫 번째 차수 시작일: 기록일 + 3일 (월요일)
        first_round_start = first_record + timedelta(days=3)

        # 거래 날짜
        trans_date = datetime.strptime(record_date, '%Y-%m-%d')

        # 첫 번째 차수 종료일
        first_round_end = first_round_start + timedelta(days=11)

        # 거래일이 첫 번째 차수 범위 내인지 확인
        if trans_date <= first_round_end:
            round_number = 1
        else:
            # 첫 번째 차수 이후: 몇 번째 차수인지 계산
            days_from_first_end = (trans_date - first_round_end).days
            round_number = (days_from_first_end // 14) + 2

        return f"{round_number}차수"

    def add_transaction(self, transaction: RoundTransaction) -> bool:
        """
        매수/매도 기록 추가

        Args:
            transaction: 매수/매도 기록

        Returns:
            성공 여부
        """
        try:
            with open(self.transactions_csv, 'a', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    transaction.round_id,
                    transaction.date,
                    transaction.transaction_type,
                    transaction.shares,
                    transaction.price,
                    transaction.total_amount,
                    transaction.shares_after,
                    transaction.pool_after,
                    transaction.notes,
                    datetime.now().isoformat()
                ])
            return True
        except Exception as e:
            print(f"❌ 기록 추가 실패: {e}")
            return False

    def update_round_summary(self, round_info: RoundInfo) -> bool:
        """
        차수 요약 정보 업데이트

        Args:
            round_info: 차수 정보

        Returns:
            성공 여부
        """
        try:
            # 기존 기록 확인
            rounds = self.load_all_rounds()

            # 같은 round_id가 있으면 삭제
            rounds = [r for r in rounds if r['round_id'] != round_info.round_id]

            # 새로운 라운드 추가
            rounds.append({
                'round_id': round_info.round_id,
                'start_date': round_info.start_date,
                'end_date': round_info.end_date,
                'initial_shares': round_info.initial_shares,
                'initial_pool': round_info.initial_pool,
                'final_shares': round_info.final_shares,
                'final_pool': round_info.final_pool,
                'shares_change': round_info.shares_change,
                'pool_change': round_info.pool_change,
                'created_at': datetime.now().isoformat()
            })

            # CSV에 덮어쓰기
            with open(self.rounds_csv, 'w', encoding='utf-8', newline='') as f:
                fieldnames = [
                    'round_id', 'start_date', 'end_date',
                    'initial_shares', 'initial_pool',
                    'final_shares', 'final_pool',
                    'shares_change', 'pool_change',
                    'created_at'
                ]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rounds)

            return True
        except Exception as e:
            print(f"❌ 차수 업데이트 실패: {e}")
            return False

    def load_all_rounds(self) -> List[Dict]:
        """모든 차수 정보 로드"""
        rounds = []
        if not os.path.exists(self.rounds_csv):
            return rounds

        try:
            with open(self.rounds_csv, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rounds.append(row)
        except Exception as e:
            print(f"❌ 차수 로드 실패: {e}")

        return rounds

    def load_round_transactions(self, round_id: str) -> List[Dict]:
        """
        특정 차수의 거래 내역 로드

        Args:
            round_id: 차수 ID

        Returns:
            거래 내역 리스트
        """
        transactions = []
        if not os.path.exists(self.transactions_csv):
            return transactions

        try:
            with open(self.transactions_csv, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['round_id'] == round_id:
                        transactions.append(row)
        except Exception as e:
            print(f"❌ 거래 내역 로드 실패: {e}")

        return transactions

    def get_latest_round_info(self) -> Optional[Dict]:
        """가장 최근 차수 정보 반환"""
        rounds = self.load_all_rounds()
        if not rounds:
            return None
        return rounds[-1]  # 가장 최근 차수
