#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
환율 추적 프로그램
원화 → 달러 환전 기록을 관리하고, 달러 사용을 추적하며 재환전 시 이익을 계산합니다.
"""

import csv
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional, Union
from abc import ABC, abstractmethod

# Windows에서 UTF-8 출력을 위한 설정
if sys.platform == 'win32' and hasattr(sys.stdout, 'buffer'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

# Windows 10+에서 ANSI 색상 코드 지원
if sys.platform == 'win32':
    import ctypes
    kernel32 = ctypes.windll.kernel32
    kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)


class Colors:
    """콘솔 색상 코드"""
    GREEN = '\033[92m'      # 녹색 (이익)
    RED = '\033[91m'        # 빨간색 (손실)
    YELLOW = '\033[93m'     # 노란색
    BLUE = '\033[94m'       # 파란색
    RESET = '\033[0m'       # 리셋
    BOLD = '\033[1m'        # 굵게


def color_text(text: str, color: str) -> str:
    """텍스트에 색상 적용"""
    return f"{color}{text}{Colors.RESET}"


def format_profit(profit_amount: float, profit_rate: float) -> tuple:
    """이익/손실 포맷팅"""
    if profit_amount > 0:
        status = color_text("[UP] 이익", Colors.GREEN)
        amount = color_text(f"+₩{profit_amount:,.0f}", Colors.GREEN)
        rate = color_text(f"+{profit_rate:.2f}%", Colors.GREEN)
    elif profit_amount < 0:
        status = color_text("[DOWN] 손실", Colors.RED)
        amount = color_text(f"-₩{abs(profit_amount):,.0f}", Colors.RED)
        rate = color_text(f"{profit_rate:.2f}%", Colors.RED)
    else:
        status = "[SAME] 동일"
        amount = f"₩{abs(profit_amount):,.0f}"
        rate = f"{profit_rate:.2f}%"

    return status, amount, rate


class BaseRecord(ABC):
    """모든 기록의 기본 클래스"""

    def __init__(self, date: str, amount_usd: float):
        self.date = date
        self.amount_usd = amount_usd

    @abstractmethod
    def to_dict(self) -> Dict[str, str]:
        """딕셔너리로 변환"""
        pass

    @abstractmethod
    def get_type(self) -> str:
        """기록 타입 반환"""
        pass


class ExchangeRecord(BaseRecord):
    """환전 기록을 나타내는 클래스"""

    def __init__(self, date: str, rate: float, amount_usd: float):
        super().__init__(date, amount_usd)
        self.rate = rate  # 원/달러
        self.amount_krw = rate * amount_usd  # 원화

    def to_dict(self) -> Dict[str, str]:
        """딕셔너리로 변환"""
        return {
            'type': 'exchange',
            'date': self.date,
            'rate': str(self.rate),
            'amount_usd': str(self.amount_usd),
            'amount_krw': str(self.amount_krw),
            'purpose': '',
            'note': ''
        }

    def get_type(self) -> str:
        return "exchange"


class USDUsage(BaseRecord):
    """달러 사용 기록을 나타내는 클래스"""

    def __init__(self, date: str, amount_usd: float, purpose: str, note: str = ''):
        super().__init__(date, amount_usd)
        self.purpose = purpose  # 사용 용도
        self.note = note  # 메모

    def to_dict(self) -> Dict[str, str]:
        """딕셔너리로 변환"""
        return {
            'type': 'usage',
            'date': self.date,
            'rate': '0',
            'amount_usd': str(self.amount_usd),
            'amount_krw': '0',
            'purpose': self.purpose,
            'note': self.note
        }

    def get_type(self) -> str:
        return "usage"


class ExchangeRateTracker:
    """환율 추적 메인 클래스"""

    def __init__(self, csv_file: str = 'exchange_records.csv'):
        self.csv_file = csv_file
        self.records: List[BaseRecord] = []
        self.load_records()

    def load_records(self):
        """CSV 파일에서 기록 로드"""
        if not os.path.exists(self.csv_file):
            return

        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                self.records = []
                for row in reader:
                    record_type = row.get('type', 'exchange')
                    if record_type == 'exchange':
                        self.records.append(ExchangeRecord(
                            date=row['date'],
                            rate=float(row['rate']),
                            amount_usd=float(row['amount_usd'])
                        ))
                    elif record_type == 'usage':
                        self.records.append(USDUsage(
                            date=row['date'],
                            amount_usd=float(row['amount_usd']),
                            purpose=row.get('purpose', ''),
                            note=row.get('note', '')
                        ))
        except Exception as e:
            print(f"[ERROR] 기록 로드 중 오류 발생: {e}")
            self.records = []

    def save_records(self):
        """기록을 CSV 파일에 저장"""
        try:
            with open(self.csv_file, 'w', encoding='utf-8', newline='') as f:
                fieldnames = ['type', 'date', 'rate', 'amount_usd', 'amount_krw', 'purpose', 'note']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for record in self.records:
                    writer.writerow(record.to_dict())
        except Exception as e:
            print(f"[ERROR] 기록 저장 중 오류 발생: {e}")

    def get_current_usd_balance(self) -> float:
        """현재 보유 달러 계산"""
        total_exchanged = sum(
            r.amount_usd for r in self.records
            if isinstance(r, ExchangeRecord)
        )
        total_used = sum(
            r.amount_usd for r in self.records
            if isinstance(r, USDUsage)
        )
        return total_exchanged - total_used

    def add_exchange_record(self, date: str, rate: float, amount_usd: float) -> bool:
        """새 환전 기록 추가"""
        if rate <= 0 or amount_usd <= 0:
            print("[ERROR] 환율과 금액은 양수여야 합니다.")
            return False

        record = ExchangeRecord(date, rate, amount_usd)
        self.records.append(record)
        self.save_records()
        return True

    def add_usage_record(self, date: str, amount_usd: float, purpose: str, note: str = '') -> bool:
        """새 달러 사용 기록 추가"""
        if amount_usd <= 0:
            print("[ERROR] 금액은 양수여야 합니다.")
            return False

        current_balance = self.get_current_usd_balance()
        if amount_usd > current_balance:
            print(f"[ERROR] 잔액이 부족합니다. 현재 보유: ${current_balance:.2f}, 사용 요청: ${amount_usd:.2f}")
            return False

        record = USDUsage(date, amount_usd, purpose, note)
        self.records.append(record)
        self.save_records()
        return True

    def get_statistics(self) -> Optional[Dict]:
        """통계 정보 계산"""
        exchange_records = [r for r in self.records if isinstance(r, ExchangeRecord)]
        usage_records = [r for r in self.records if isinstance(r, USDUsage)]

        if not exchange_records:
            return None

        total_exchanged = sum(r.amount_usd for r in exchange_records)
        total_used = sum(r.amount_usd for r in usage_records)
        total_krw = sum(r.amount_krw for r in exchange_records)

        # 평균 환율 = 총 투자 원화 ÷ 총 환전 금액 (사용 금액 무관)
        average_rate = total_krw / total_exchanged if total_exchanged > 0 else 0

        return {
            'exchange_count': len(exchange_records),
            'usage_count': len(usage_records),
            'total_exchanged_usd': total_exchanged,
            'total_used_usd': total_used,
            'current_balance_usd': total_exchanged - total_used,
            'total_krw': total_krw,
            'average_rate': average_rate
        }

    def calculate_profit(self, target_rate: float) -> Optional[Dict]:
        """재환전 시 이익 계산 (현재 보유 달러로만)"""
        if target_rate <= 0:
            print("[ERROR] 환율은 양수여야 합니다.")
            return None

        stats = self.get_statistics()
        if not stats:
            return None

        current_balance = stats['current_balance_usd']
        total_krw = stats['total_krw']

        if current_balance <= 0:
            print("[INFO] 현재 보유 달러가 없습니다.")
            return None

        # 현재 보유 달러의 현재 가치 (평균 환율 기준)
        current_value_krw = current_balance * stats['average_rate']

        # 재환전 후 가치
        new_krw = current_balance * target_rate

        # 이익 = 재환전 후 가치 - 현재 가치
        profit = new_krw - current_value_krw
        profit_rate = (profit / current_value_krw) * 100

        return {
            'target_rate': target_rate,
            'current_balance_usd': current_balance,
            'current_value_krw': current_value_krw,
            'new_value_krw': new_krw,
            'profit': profit,
            'profit_rate': profit_rate,
            'average_rate': stats['average_rate'],
            'total_invested_krw': total_krw
        }

    def display_records(self):
        """전체 기록 표시 (환전/사용 구분)"""
        if not self.records:
            print("[LIST] 기록된 데이터가 없습니다.")
            return

        # 날짜순 정렬
        sorted_records = sorted(self.records, key=lambda x: x.date)

        print("\n" + "="*80)
        print("[LIST] 전체 기록 보기")
        print("="*80)
        print(f"{'날짜':<12} {'타입':<8} {'환율(원/$)':<12} {'금액($)':<12} {'용도/메모':<20}")
        print("-"*80)

        for record in sorted_records:
            if isinstance(record, ExchangeRecord):
                in_tag = color_text("[IN]", Colors.GREEN)
                print(f"{record.date:<12} {in_tag:<8} {record.rate:>10,.0f}  {record.amount_usd:>10,.2f}  {'환전':<20}")
            elif isinstance(record, USDUsage):
                out_tag = color_text("[OUT]", Colors.RED)
                purpose_display = record.purpose[:15] + '...' if len(record.purpose) > 15 else record.purpose
                print(f"{record.date:<12} {out_tag:<8} {'-':>10}  {record.amount_usd:>10,.2f}  {purpose_display:<20}")

        print("="*80)

    def display_statistics(self):
        """통계 표시"""
        stats = self.get_statistics()

        if not stats:
            print("[STATS] 기록된 데이터가 없습니다.")
            return

        print("\n" + "="*70)
        print("[STATS] 환전 통계")
        print("="*70)
        print(f"환전 횟수:       {stats['exchange_count']}회")
        print(f"사용 횟수:       {stats['usage_count']}회")
        print("-"*70)
        print(f"총 환전 금액:   ${stats['total_exchanged_usd']:,.2f}")
        print(f"총 사용 금액:   ${stats['total_used_usd']:,.2f}")
        print(f"현재 보유 달러: ${stats['current_balance_usd']:,.2f}")
        print("-"*70)
        print(f"총 투자 원화:   ₩{stats['total_krw']:,.0f}")
        print(f"평균 환율:      ₩{stats['average_rate']:,.2f}/$ (변하지 않음)")
        print("="*70)

    def display_profit_calculation(self, target_rate: float):
        """이익 계산 결과 표시"""
        result = self.calculate_profit(target_rate)

        if not result:
            if result is None:
                stats = self.get_statistics()
                if stats and stats['current_balance_usd'] <= 0:
                    print("[PROFIT] 현재 보유 달러가 없습니다.")
                else:
                    print("[PROFIT] 먼저 환전 기록을 추가해주세요.")
            return

        # 색상 포맷팅
        profit_status, profit_amount, profit_rate = format_profit(
            result['profit'], result['profit_rate']
        )

        print("\n" + "="*70)
        print("[PROFIT] 재환전 이익 계산")
        print("="*70)
        print(f"현재 보유 달러:           ${result['current_balance_usd']:,.2f}")
        print(f"현재 보유 달러의 원화 가치: ₩{result['current_value_krw']:,.0f} (평균 환율 기준)")
        print(f"평균 환율:                ₩{result['average_rate']:,.2f}/$ (변하지 않음)")
        print(f"목표 환율:                ₩{result['target_rate']:,.0f}/$")
        print("-"*70)
        print(f"재환전 후 원화:            ₩{result['new_value_krw']:,.0f}")
        print(f"예상 {profit_status}:       {profit_amount} ({profit_rate})")
        print("="*70)

    def reset_all_data(self) -> bool:
        """모든 데이터 초기화 (이중 확인)"""
        stats = self.get_statistics()

        # 빈 데이터 확인
        if not stats or (stats['exchange_count'] == 0 and stats['usage_count'] == 0):
            print("\n[RESET] 삭제할 데이터가 없습니다.")
            return False

        # 현재 상태 표시
        print("\n" + "="*70)
        print("[RESET] 데이터 초기화")
        print("="*70)
        print(f"총 환전 횟수:  {stats['exchange_count']}회")
        print(f"사용 횟수:      {stats['usage_count']}회")
        print(f"현재 보유:     ${stats['current_balance_usd']:,.2f}")
        print(f"총 투자 원화:   ₩{stats['total_krw']:,.0f}")
        print("-"*70)
        print(color_text("[WARNING] 모든 데이터가 영구적으로 삭제됩니다!", Colors.RED))
        print(color_text("[WARNING] 이 작업은 되돌릴 수 없습니다!", Colors.RED))
        print("="*70)

        # 첫 번째 확인
        first_confirm = input("\n정말로 모든 데이터를 삭제하시겠습니까? (yes/no): ").strip().lower()

        if first_confirm not in ['yes', 'y']:
            print("\n[RESET] 초기화가 취소되었습니다.")
            return False

        # 두 번째 확인
        print("\n" + "="*70)
        print(color_text("[WARNING] 마지막 확인입니다!", Colors.RED))
        print(color_text("[WARNING] 정말로 모든 데이터를 삭제하시겠습니까?", Colors.RED))
        print("="*70)

        second_confirm = input("\n삭제를 진행하려면 'DELETE'를 입력하세요: ").strip()

        if second_confirm != 'DELETE':
            print("\n[RESET] 초기화가 취소되었습니다.")
            return False

        # 데이터 초기화
        try:
            # CSV 파일 삭제
            if os.path.exists(self.csv_file):
                os.remove(self.csv_file)

            # 메모리 초기화
            self.records = []

            print("\n" + "="*70)
            print(color_text("[SUCCESS] 모든 데이터가 삭제되었습니다.", Colors.GREEN))
            print("="*70)
            return True

        except Exception as e:
            print(f"\n[ERROR] 데이터 삭제 중 오류가 발생했습니다: {e}")
            return False


def get_date_input() -> str:
    """날짜 입력 받기"""
    today = datetime.now().strftime("%Y-%m-%d")
    date_input = input(f"날짜 (YYYY-MM-DD, 기본값: {today}): ").strip()

    if not date_input:
        return today

    try:
        datetime.strptime(date_input, "%Y-%m-%d")
        return date_input
    except ValueError:
        print("[ERROR] 잘못된 날짜 형식입니다. 오늘 날짜를 사용합니다.")
        return today


def get_float_input(prompt: str, min_value: float = 0) -> Optional[float]:
    """실수 입력 받기"""
    try:
        value = float(input(prompt))
        if value <= min_value:
            print(f"[ERROR] 값은 {min_value}보다 커야 합니다.")
            return None
        return value
    except ValueError:
        print("[ERROR] 잘못된 입력입니다. 숫자를 입력해주세요.")
        return None


def get_purpose_input() -> str:
    """사용 용도 입력 받기"""
    print("\n[USAGE] 자주 사용하는 용도:")
    print("  1. 주식 매수")
    print("  2. ETF 매수")
    print("  3. 배당금 재투자")
    print("  4. 기타")

    choice = input("용도를 선택하세요 (1-4, 기본값: 4): ").strip()

    purposes = {
        '1': '주식 매수',
        '2': 'ETF 매수',
        '3': '배당금 재투자',
        '4': '기타'
    }

    purpose = purposes.get(choice, purposes['4'])

    if choice == '4' or not choice:
        custom_purpose = input("직접 입력: ").strip()
        if custom_purpose:
            purpose = custom_purpose

    return purpose


def main():
    """메인 프로그램"""
    tracker = ExchangeRateTracker()

    while True:
        print("\n" + "="*70)
        print("[APP] 환율 추적 프로그램")
        print("="*70)
        print("1. 환율 기록 추가 (원화 → 달러)")
        print("2. 달러 사용 기록 추가 (달러 사용)")
        print("3. 전체 기록 보기")
        print("4. 통계 보기")
        print("5. 재환전 이익 계산")
        print("6. 데이터 초기화")
        print("7. 종료")
        print("="*70)

        choice = input("선택하세요 (1-7): ").strip()

        if choice == '1':
            print("\n[ADD] 환율 기록 추가")
            print("-"*70)
            date = get_date_input()
            rate = get_float_input("환율 (원/달러): ")
            if rate is None:
                continue

            amount_usd = get_float_input("환전 금액 (달러): ")
            if amount_usd is None:
                continue

            if tracker.add_exchange_record(date, rate, amount_usd):
                print(f"[OK] 기록이 추가되었습니다: {date} - {rate}원/$, ${amount_usd:.2f}")

        elif choice == '2':
            print("\n[USAGE] 달러 사용 기록 추가")
            print("-"*70)
            date = get_date_input()

            current_balance = tracker.get_current_usd_balance()
            print(f"[INFO] 현재 보유 달러: ${current_balance:.2f}")

            amount_usd = get_float_input("사용 금액 (달러): ")
            if amount_usd is None:
                continue

            purpose = get_purpose_input()
            note = input("메모 (선택사항): ").strip()

            if tracker.add_usage_record(date, amount_usd, purpose, note):
                print(f"[OK] 사용 기록이 추가되었습니다: {date} - ${amount_usd:.2f} ({purpose})")

        elif choice == '3':
            tracker.display_records()

        elif choice == '4':
            tracker.display_statistics()

        elif choice == '5':
            stats = tracker.get_statistics()
            if not stats:
                print("[PROFIT] 먼저 환전 기록을 추가해주세요.")
                continue

            if stats['current_balance_usd'] <= 0:
                print("[PROFIT] 현재 보유 달러가 없습니다.")
                continue

            print(f"\n[PROFIT] 현재 보유: ${stats['current_balance_usd']:,.2f}, 평균 환율: ₩{stats['average_rate']:,.0f}/$")
            target_rate = get_float_input("목표 환율 (원/달러): ")
            if target_rate is None:
                continue

            tracker.display_profit_calculation(target_rate)

        elif choice == '6':
            tracker.reset_all_data()

        elif choice == '7':
            print("\n[BYE] 프로그램을 종료합니다.")
            break

        else:
            print("[ERROR] 잘못된 선택입니다. 1-7 사이의 숫자를 입력해주세요.")


if __name__ == "__main__":
    main()
