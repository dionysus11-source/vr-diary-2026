"""
라오어 밸류 리밸런싱 CLI 메인 프로그램
"""
import sys
import os
from datetime import datetime
from typing import Optional

# 모듈 임포트
from calculator import ValueCalculator
from data_manager import DataManager
from price_cache_manager import PriceCacheManager
from price_fetcher import PriceFetcher
from simulator import Week5PurchaseSimulator
from chart_generator import ChartGenerator
from round_manager import RoundManager, RoundTransaction, RoundInfo
from models.record import RebalancingRecord
from models.price_cache import PriceCache


class ValueRebalancingCLI:
    """밸류 리밸런싱 CLI"""

    def __init__(self):
        """초기화"""
        self.data_manager = DataManager()
        self.cache_manager = PriceCacheManager()
        self.price_fetcher = PriceFetcher(self.cache_manager)
        self.calculator = ValueCalculator()
        self.simulator = Week5PurchaseSimulator()
        self.chart_generator = ChartGenerator()
        self.round_manager = RoundManager()
        self.init_colorama()

    def init_colorama(self):
        """colorama 초기화 (Windows 색상 지원)"""
        try:
            import colorama
            colorama.init(autoreset=True)
        except ImportError:
            print("⚠️  colorama 라이브러리가 없습니다. 색상이 제대로 표시되지 않을 수 있습니다.")
            print("   설치: pip install colorama")

    def print_header(self):
        """프로그램 헤더 출력"""
        print("\n" + "="*80)
        print(" " * 20 + "📊 라오어 밸류 리밸런싱 CLI")
        print(" " * 15 + "TQQQ 레버리지 ETF 투자 관리 도구")
        print("="*80 + "\n")

    def print_menu(self):
        """메인 메뉴 출력"""
        menu_options = [
            "1. 초기 설정 (최초 설정 & 벤치마크 기준)",
            "2. 차수 입력 (새로운 차수 V값 계산)",
            "3. 현재 상황 보기 (전체 기록 & 그래프)",
            "4. 예약 주문 시뮬레이션 (V±15% 밴드)",
            "5. TQQQ 가격 관리 (조회 & 캐시)",
            "6. 매수/매도 기록 (차수별 거래 관리)",
            "7. 데이터 초기화 (모든 데이터 삭제)",
            "8. 종료"
        ]

        for option in menu_options:
            print(f"  {option}")
        print()

    def run(self):
        """CLI 실행"""
        self.print_header()

        while True:
            self.print_menu()

            choice = input("선택하세요 (1-8): ").strip()

            if choice == '1':
                self.setup_initial_with_first_value()
            elif choice == '2':
                self.weekly_value_calculation()
            elif choice == '3':
                self.view_daily_values()
            elif choice == '4':
                self.run_simulation()
            elif choice == '5':
                self.view_price_history()
            elif choice == '6':
                self.manage_round_transactions()
            elif choice == '7':
                self.reset_data()
            elif choice == '8':
                print("\n👋 프로그램을 종료합니다.")
                break
            else:
                print("\n❌ 잘못된 선택입니다. 1-8 사이의 숫자를 입력하세요.\n")

            input("\n엔터 키를 누르면 계속...")

    def setup_initial_with_first_value(self):
        """초기 설정 & 첫 V값 계산"""
        print("\n" + "-"*80)
        print("🎯 초기 설정 & 첫 V값 계산")
        print("-"*80 + "\n")

        # 기존 설정이 있는지 확인
        existing_portfolio = self.data_manager.get_initial_portfolio()
        existing_records = self.data_manager.load_records()

        if existing_portfolio:
            print("📋 현재 초기 포트폴리오 설정:")
            print(f"   날짜: {existing_portfolio['initial_date']}")
            print(f"   현금: ${existing_portfolio['initial_cash']:,.2f}")
            print(f"   주식수: {existing_portfolio['initial_shares']:,}")
            print(f"   평단가: ${existing_portfolio['average_price']:,.2f}")
            print(f"   평가금액: ${existing_portfolio['initial_shares'] * existing_portfolio['average_price']:,.2f}")

            if existing_records:
                print(f"\n📊 이미 {len(existing_records)}개의 V값 기록이 있습니다.")
                print("   초기 설정을 변경하면 기존 기록과 혼동될 수 있습니다.")
            else:
                print("\n📊 첫 V값이 아직 계산되지 않았습니다.")

            overwrite = input("\n새로 설정하시겠습니까? (y/n): ").lower()
            if overwrite != 'y':
                print("\n취소되었습니다.")
                return
            print()

        try:
            # 날짜 입력
            print("날짜를 입력하세요 (YYYY-MM-DD, 엔터 시 오늘 날짜)")
            date_input = input("초기 날짜: ").strip()

            if date_input:
                try:
                    from datetime import datetime
                    datetime.strptime(date_input, '%Y-%m-%d')
                    initial_date = date_input
                except ValueError:
                    print("\n❌ 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")
                    return
            else:
                from datetime import datetime
                initial_date = datetime.now().strftime('%Y-%m-%d')
                print(f"(오늘 날짜: {initial_date})")

            initial_cash = float(input("초기 현금(Pool): $"))
            initial_shares = int(input("초기 주식수: "))
            average_price = float(input("평단가: $"))

            if initial_cash < 0 or initial_shares < 0 or average_price < 0:
                print("\n❌ 현금, 주식수, 평단가는 0 이상이어야 합니다.")
                return

            # 초기 포트폴리오 저장
            if self.data_manager.save_initial_portfolio(initial_cash, initial_shares, average_price, initial_date):
                print("\n✅ 초기 포트폴리오가 저장되었습니다.")
                print(f"   날짜: {initial_date}")
                print(f"   현금(Pool): ${initial_cash:,.2f}")
                print(f"   주식수: {initial_shares:,}")
                print(f"   평단가: ${average_price:,.2f}")

                # 첫 V값 계산 (초기 설정이므로 previous_v는 None)
                e_value = self.calculator.calculate_evaluation(average_price, initial_shares)
                v_value = self.calculator.calculate_v(e_value, initial_cash, None)

                # 벤치마크 계산 (초기 총액을 전부 TQQQ에 투자한 경우)
                total_invested = (initial_shares * average_price) + initial_cash
                benchmark_shares = total_invested / average_price
                benchmark_value = benchmark_shares * average_price

                print(f"\n📊 첫 V값 계산:")
                print(f"   총 투자: ${total_invested:,.2f} (주식 {initial_shares}주 × ${average_price:.2f} + 현금 ${initial_cash:,.2f})")
                print(f"   평가금액(E): ${e_value:,.2f}")
                print(f"   계산된 V값: ${v_value:,.2f}")
                print(f"\n📊 벤치마크 (전액 TQQQ 투자):")
                print(f"   총 투자: ${total_invested:,.2f}")
                print(f"   벤치마크 주식수: {benchmark_shares:.2f}주")
                print(f"   벤치마크 가치: ${benchmark_value:,.2f}")

                # 첫 기록 저장
                first_record = RebalancingRecord(
                    date=initial_date,
                    price=average_price,
                    shares=initial_shares,
                    pool=initial_cash,
                    e_value=e_value,
                    v_value=v_value,
                    signal='INITIAL',
                    benchmark_shares=benchmark_shares,
                    benchmark_value=benchmark_value,
                    created_at=datetime.now().isoformat()
                )

                if self.data_manager.save_record(first_record):
                    print(f"\n✅ 첫 V값이 기록되었습니다.")
                    print(f"   날짜: {initial_date}")
                    print(f"   평가금액(E): ${e_value:,.2f}")
                    print(f"   V값: ${v_value:,.2f}")
                    print(f"   Pool: ${initial_cash:,.2f}")
                    print(f"   벤치마크: ${benchmark_value:,.2f}")

        except ValueError:
            print("\n❌ 숫자를 올바르게 입력해주세요.")

    def setup_initial_portfolio(self):
        """초기 포트폴리오 설정"""
        print("\n" + "-"*80)
        print("🎯 초기 포트폴리오 설정")
        print("-"*80 + "\n")

        # 기존 설정이 있는지 확인
        existing_portfolio = self.data_manager.get_initial_portfolio()
        if existing_portfolio:
            print("📋 현재 초기 포트폴리오 설정:")
            print(f"   날짜: {existing_portfolio['initial_date']}")
            print(f"   현금: ${existing_portfolio['initial_cash']:,.2f}")
            print(f"   주식수: {existing_portfolio['initial_shares']:,}")
            print(f"   평단가: ${existing_portfolio['average_price']:,.2f}")
            print(f"   평가금액: ${existing_portfolio['initial_shares'] * existing_portfolio['average_price']:,.2f}")

            overwrite = input("\n새로 설정하시겠습니까? (y/n): ").lower()
            if overwrite != 'y':
                print("\n취소되었습니다.")
                return
            print()

        try:
            # 날짜 입력 (선택사항)
            print("날짜를 입력하세요 (YYYY-MM-DD, 엔터 시 오늘 날짜)")
            date_input = input("초기 날짜: ").strip()

            if date_input:
                # 날짜 형식 검증
                try:
                    from datetime import datetime
                    datetime.strptime(date_input, '%Y-%m-%d')
                    initial_date = date_input
                except ValueError:
                    print("\n❌ 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")
                    return
            else:
                from datetime import datetime
                initial_date = datetime.now().strftime('%Y-%m-%d')
                print(f"(오늘 날짜: {initial_date})")

            initial_cash = float(input("초기 현금: $"))
            initial_shares = int(input("초기 주식수: "))
            average_price = float(input("평단가: $"))

            if initial_cash < 0 or initial_shares < 0 or average_price < 0:
                print("\n❌ 현금, 주식수, 평단가는 0 이상이어야 합니다.")
                return

            if self.data_manager.save_initial_portfolio(initial_cash, initial_shares, average_price, initial_date):
                print("\n✅ 초기 포트폴리오가 저장되었습니다.")
                print(f"   날짜: {initial_date}")
                print(f"   현금: ${initial_cash:,.2f}")
                print(f"   주식수: {initial_shares:,}")
                print(f"   평단가: ${average_price:,.2f}")
                print(f"   평가금액: ${initial_shares * average_price:,.2f}")

        except ValueError:
            print("\n❌ 숫자를 올바르게 입력해주세요.")

    def weekly_value_calculation(self):
        """주말 종가 기준 V값 계산 & 기록"""
        print("\n" + "-"*80)
        print("📈 주말 종가 기준 V값 계산 & 기록")
        print("-"*80 + "\n")

        # 초기 포트폴리오 확인
        if not self.data_manager.has_initial_portfolio():
            print("❌ 먼저 초기 설정을 완료해주세요 (메뉴 1번)")
            return

        # 기존 기록 확인
        latest_record = self.data_manager.get_latest_record()
        if latest_record is None:
            print("❌ 첫 V값이 계산되지 않았습니다. 메뉴 1번에서 초기 설정을 완료해주세요.")
            return

        print(f"📋 가장 최근 기록: {latest_record.date}")
        print(f"   V값: ${latest_record.v_value:,.2f}")
        print(f"   Pool: ${latest_record.pool:,.2f}")
        print(f"   주식수: {latest_record.shares:,}")
        print(f"   벤치마크: ${latest_record.benchmark_value:,.2f}")
        print()

        # 현재 포트폴리오 상태 입력
        try:
            print("현재 포트폴리오 상태를 입력해주세요.")
            pool = float(input("현금(Pool): $"))
            shares = int(input("주식수: "))

            if pool < 0 or shares < 0:
                print("\n❌ 현금과 주식수는 0 이상이어야 합니다.")
                return

        except ValueError:
            print("\n❌ 숫자를 입력해주세요.")
            return

        # 날짜 입력
        print("\n날짜를 입력하세요 (YYYY-MM-DD)")
        date_input = input("계산할 날짜: ").strip()

        if date_input:
            try:
                datetime.strptime(date_input, '%Y-%m-%d')
                date_str = date_input
            except ValueError:
                print("\n❌ 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")
                return
        else:
            date_str = datetime.now().strftime('%Y-%m-%d')
            print(f"(오늘 날짜: {date_str})")

        # 가격 자동 조회
        print("\n📡 야후 파이낸스 API에서 가격 조회 중...")
        price, fetched_date = self.price_fetcher.get_friday_price_with_fallback()

        if price is None:
            print("\n❌ 가격을 가져올 수 없습니다. 직접 입력해주세요.")
            try:
                date_str = input("날짜 (YYYY-MM-DD): ")
                price = float(input("TQQQ 종가: $"))
            except ValueError:
                print("\n❌ 날짜와 가격을 올바르게 입력해주세요.")
                return
        else:
            if date_str != fetched_date:
                print(f"⚠️  조회된 날짜({fetched_date})가 입력한 날짜({date_str})와 다릅니다.")
                use_fetched = input(f"조회된 날짜({fetched_date})를 사용하시겠습니까? (y/n): ").lower()
                if use_fetched == 'y':
                    date_str = fetched_date

        # 평가금액 계산
        e_value = self.calculator.calculate_evaluation(price, shares)
        print(f"\n📊 평가금액(E): ${e_value:,.2f} (종가 ${price:.2f} × {shares:,}주)")

        # 이전 V값 확인
        latest_record = self.data_manager.get_latest_record()
        if latest_record is not None:
            print(f"📌 이전 V값: ${latest_record.v_value:,.2f}")

        # V값 계산 (라오어 밸류 리밸런싱 공식)
        # v2 = v1 + (pool/10) + (e-v1)/6.32
        previous_v = latest_record.v_value if latest_record else None
        v_value = self.calculator.calculate_v(e_value, pool, previous_v)

        # 계산된 값 표시 및 확인/수정 단계
        print("\n" + "="*80)
        print("📊 계산된 값 확인")
        print("="*80)
        print(f"날짜: {date_str}")
        print(f"현금(Pool): ${pool:,.2f}")
        print(f"주식수: {shares:,}주")
        print(f"TQQQ 종가: ${price:.2f}")
        print(f"평가금액(E): ${e_value:,.2f} (종가 ${price:.2f} × {shares:,}주)")
        print(f"V값: ${v_value:,.2f}")
        print("="*80)

        # 사용자 확인 및 수정
        print("\n값을 확인하고 수정하세요 (엔터 = 그대로 사용, 값 입력 = 수정):")

        try:
            # 날짜 확인
            date_confirm = input(f"날짜 ({date_str}): ").strip()
            if date_confirm:
                try:
                    datetime.strptime(date_confirm, '%Y-%m-%d')
                    date_str = date_confirm
                except ValueError:
                    print("❌ 날짜 형식이 올바르지 않습니다. 기존값을 유지합니다.")

            # Pool 확인
            pool_confirm = input(f"현금(Pool) (${pool:,.2f}): $").strip()
            if pool_confirm:
                new_pool = float(pool_confirm)
                if new_pool >= 0:
                    pool = new_pool

            # 주식수 확인
            shares_confirm = input(f"주식수 ({shares:,}주): ").strip()
            if shares_confirm:
                new_shares = int(shares_confirm)
                if new_shares >= 0:
                    shares = new_shares

            # 종가 확인
            price_confirm = input(f"TQQQ 종가 (${price:.2f}): $").strip()
            price_modified = False
            if price_confirm:
                new_price = float(price_confirm)
                if new_price > 0:
                    price = new_price
                    price_modified = True

            # 값이 변경되었으면 재계산
            if date_confirm or pool_confirm or shares_confirm or price_confirm:
                print("\n🔄 변경된 값으로 재계산 중...")
                e_value = self.calculator.calculate_evaluation(price, shares)
                v_value = self.calculator.calculate_v(e_value, pool, previous_v)

                print(f"\n📊 최종 값:")
                print(f"날짜: {date_str}")
                print(f"현금(Pool): ${pool:,.2f}")
                print(f"주식수: {shares:,}주")
                print(f"TQQQ 종가: ${price:.2f}")
                print(f"평가금액(E): ${e_value:,.2f}")
                print(f"V값: ${v_value:,.2f}")

            # 종가가 수정되었으면 가격 캐시에도 저장
            if price_modified:
                self.price_fetcher.fetch_price_manual(date_str, price)
                print(f"✅ 수정된 종가를 가격 캐시에 저장했습니다.")

        except ValueError:
            print("\n❌ 입력이 올바르지 않습니다. 기존 계산값을 사용합니다.")

        # 최종 확인
        final_confirm = input("\n위 값으로 저장하시겠습니까? (y/n): ").lower()
        if final_confirm != 'y':
            print("\n취소되었습니다.")
            return

        # 계산 과정 상세 출력
        print(f"\n💰 V값 계산 과정:")
        if previous_v is not None:
            print(f"   v1 (이전 V값): ${previous_v:,.2f}")
            print(f"   pool/10: ${pool / 10:,.2f}")
            print(f"   e-v1: ${e_value - previous_v:+,.2f}")
            print(f"   (e-v1)/6.32: ${(e_value - previous_v) / 6.32:+,.2f}")
            print(f"   v2 = v1 + (pool/10) + (e-v1)/6.32")
            print(f"   v2 = {previous_v:,.2f} + {pool / 10:,.2f} + {(e_value - previous_v) / 6.32:+,.2f}")
            print(f"   v2 = ${v_value:,.2f}")
        else:
            print(f"   V = E + (pool/10) (초기값)")
            print(f"   V = {e_value:,.2f} + {pool / 10:,.2f}")
            print(f"   V = ${v_value:,.2f}")

        # 벤치마크 계산 (첫 기록에서 가져오기)
        first_record = self.data_manager.load_records()[-1]  # 가장 오래된 기록
        benchmark_shares = first_record.benchmark_shares
        benchmark_value = benchmark_shares * price  # 현재 종가 * 벤치마크 주식수

        # VR 총액 계산 (E + pool)
        vr_total = e_value + pool

        print(f"\n📊 벤치마크 비교 (Buy & Hold):")
        print(f"   벤치마크 주식수: {benchmark_shares:.4f}주")
        print(f"   벤치마크 가치: ${benchmark_value:,.2f} ({benchmark_shares:.4f}주 × ${price:.2f})")
        print(f"   VR 총액: ${vr_total:,.2f} (E ${e_value:,.2f} + Pool ${pool:,.2f})")
        print(f"   VR vs 벤치마크: ${(vr_total - benchmark_value):+,.2f} ({((vr_total / benchmark_value - 1) * 100):+.2f}%)")

        # 리밸런싱 신호
        latest_record = self.data_manager.get_latest_record()
        signal, change_rate = self.calculator.determine_signal(latest_record.v_value, v_value)
        formatted_rate = self.calculator.format_change_rate(change_rate)

        print(f"\n📊 이전 V값 대비 변화: {formatted_rate}")

        # 신호별 색상 출력
        signal_messages = {
            'BUY': ('\033[92m', "매수 신호 (BUY)", "V가 상한선(15%)을 초과했습니다."),
            'SELL': ('\033[91m', "매도 신호 (SELL)", "V가 하한선(15%)을 하회했습니다."),
            'HOLD': ('\033[93m', "유지 (HOLD)", "정상 범위 내입니다.")
        }

        color_code, signal_text, detail_text = signal_messages[signal]
        print(f"\n{color_code}🎯 {signal_text}\033[0m")
        print(f"   {detail_text}")

        # 기록 저장
        record = RebalancingRecord(
            date=date_str,
            price=price,
            shares=shares,
            pool=pool,
            e_value=e_value,
            v_value=v_value,
            signal=signal,
            benchmark_shares=benchmark_shares,
            benchmark_value=benchmark_value,
            created_at=datetime.now().isoformat()
        )

        if self.data_manager.save_record(record):
            print(f"\n✅ {date_str} 리밸런싱 기록이 저장되었습니다.")

    def view_daily_values(self):
        """날짜별 V값/Pool/평가액 조회"""
        print("\n" + "-"*80)
        print("📊 날짜별 V값/Pool/평가액 조회")
        print("-"*80 + "\n")

        records = self.data_manager.load_records()

        if not records:
            print("📭 기록이 없습니다. 메뉴 1번에서 초기 설정을 완료해주세요.")
            return

        print(f"총 {len(records)}개의 기록이 있습니다.\n")

        # 날짜 역순 정렬
        records.sort(key=lambda x: x.date, reverse=False)  # 오래된 순

        # 컬럼 너비 정의
        cols = {
            'date': 12,
            'price': 10,
            'shares': 10,
            'pool': 12,
            'e': 12,
            'v': 12,
            'benchmark': 14,      # 벤치마크 너비 증가
            'total': 14,          # 총액 너비 증가
            'diff': 16,
            'signal': 8
        }

        # 헤더 (순서: 총액 > 벤치마크)
        header = (
            self._pad_text_korean('날짜', cols['date']) + '  ' +
            self._pad_text_korean('종가', cols['price']) + '  ' +
            self._pad_text_korean('주식수', cols['shares']) + '  ' +
            self._pad_text_korean('Pool', cols['pool']) + '  ' +
            self._pad_text_korean('E', cols['e']) + '  ' +
            self._pad_text_korean('V', cols['v']) + '  ' +
            self._pad_text_korean('총액', cols['total']) + '  ' +
            self._pad_text_korean('벤치마크', cols['benchmark']) + '  ' +
            self._pad_text_korean('차이', cols['diff']) + '  ' +
            self._pad_text_korean('신호', cols['signal'])
        )
        print(header)
        print("-" * self._get_display_width(header))

        for record in records:
            # 평가금액 계산
            evaluation = self.calculator.calculate_evaluation(record.price, record.shares)
            vr_total = record.e_value + record.pool  # VR 총액
            benchmark_diff = vr_total - record.benchmark_value  # VR 총액 - 벤치마크
            benchmark_diff_pct = ((vr_total / record.benchmark_value - 1) * 100) if record.benchmark_value > 0 else 0

            # 차이 색상
            if benchmark_diff > 0:
                diff_color = '\033[92m'  # 녹색 (VR이 높음)
            elif benchmark_diff < 0:
                diff_color = '\033[91m'  # 빨간색 (벤치마크가 높음)
            else:
                diff_color = '\033[93m'  # 노란색 (동일)

            signal_color = self._get_signal_color(record.signal)

            # 데이터 행 (한글 너비 고려 패딩, 순서: 총액 > 벤치마크)
            row = (
                self._pad_text_korean(record.date, cols['date']) + '  ' +
                self._pad_text_korean(f"${record.price:.2f}", cols['price']) + '  ' +
                self._pad_text_korean(f"{record.shares:,}", cols['shares']) + '  ' +
                self._pad_text_korean(f"${record.pool:.2f}", cols['pool']) + '  ' +
                self._pad_text_korean(f"${record.e_value:.2f}", cols['e']) + '  ' +
                self._pad_text_korean(f"${record.v_value:.2f}", cols['v']) + '  ' +
                self._pad_text_korean(f"${vr_total:.2f}", cols['total']) + '  ' +
                self._pad_text_korean(f"${record.benchmark_value:.2f}", cols['benchmark']) + '  ' +
                self._pad_text_korean(f"{diff_color}${benchmark_diff:+,.2f}\033[0m", cols['diff']) + '  ' +
                self._pad_text_korean(f"{signal_color}{record.signal}\033[0m", cols['signal'])
            )
            print(row)

        # 통계
        print(f"\n📊 통계:")
        latest = records[-1]
        latest_eval = self.calculator.calculate_evaluation(latest.price, latest.shares)
        latest_vr_total = latest.e_value + latest.pool
        print(f"   최신 V값: ${latest.v_value:,.2f} ({latest.date})")
        print(f"   최신 Pool: ${latest.pool:,.2f}")
        print(f"   최신 평가금액: ${latest_eval:,.2f}")
        print(f"   최신 VR 총액: ${latest_vr_total:,.2f} (E ${latest.e_value:,.2f} + Pool ${latest.pool:,.2f})")
        print(f"   최신 벤치마크: ${latest.benchmark_value:,.2f}")
        print(f"   VR vs 벤치마크: ${(latest_vr_total - latest.benchmark_value):+,.2f} ({((latest_vr_total / latest.benchmark_value - 1) * 100):+.2f}%)")

        # VR 총액 변화
        if len(records) > 1:
            first_vr_total = records[0].e_value + records[0].pool
            last_vr_total = records[-1].e_value + records[-1].pool
            first_bench = records[0].benchmark_value
            last_bench = records[-1].benchmark_value
            vr_change = ((last_vr_total - first_vr_total) / first_vr_total) * 100 if first_vr_total > 0 else 0
            bench_change = ((last_bench - first_bench) / first_bench) * 100 if first_bench > 0 else 0

            print(f"\n   VR 총액 변화: {vr_change:+.2f}% (첫 ${first_vr_total:,.2f} → 최신 ${last_vr_total:,.2f})")
            print(f"   벤치마크 변화: {bench_change:+.2f}% (첫 ${first_bench:,.2f} → 최신 ${last_bench:,.2f})")

            # 누적 수익률 비교
            vr_return = vr_change
            benchmark_return = bench_change
            excess_return = vr_return - benchmark_return
            excess_color = '\033[92m' if excess_return > 0 else '\033[91m'

            print(f"   VR 초과 수익률: {excess_color}{excess_return:+.2f}%\033[0m")

        # 차트 생성
        print(f"\n📊 차트 생성 중...")

        # X축 간격 선택
        print(f"\nX축 날짜 간격을 선택하세요:")
        print(f"1. 2주 단위 (0.5달) - 기본값")
        print(f"2. 1달 단위")
        print(f"3. 2달 단위")
        print(f"4. 직접 입력 (N달 단위)")

        interval_months = 0.5  # 기본값 2주
        interval_choice = input(f"선택 (1-4, 엔터 시 기본값): ").strip()

        try:
            if interval_choice == '1' or interval_choice == '':
                interval_months = 0.5  # 2주
            elif interval_choice == '2':
                interval_months = 1  # 1달
            elif interval_choice == '3':
                interval_months = 2  # 2달
            elif interval_choice == '4':
                custom_months = input("몇 달 단위로 표시하시겠습니까? (예: 3, 6, 12): ").strip()
                if custom_months:
                    interval_months = float(custom_months)
                    if interval_months <= 0:
                        print("   ⚠️  0보다 작은 값은 입력할 수 없습니다. 기본값(2주)을 사용합니다.")
                        interval_months = 0.5
            else:
                print("   ⚠️  잘못된 선택입니다. 기본값(2주)을 사용합니다.")

            print(f"   ✅ X축 간격: {interval_months}달")

        except ValueError:
            print("   ⚠️  입력이 올바르지 않습니다. 기본값(2주)을 사용합니다.")
            interval_months = 0.5

        try:
            # 1. 테이블 PNG
            table_file = self.chart_generator.generate_table_png(records)
            print(f"   ✅ 테이블 차트 저장: {table_file}")

            # 2. V값 vs 벤치마크 PNG (사용자 선택 간격 적용)
            comparison_file = self.chart_generator.generate_value_comparison_png(records, interval_months)
            print(f"   ✅ 비교 차트 저장: {comparison_file}")

            # 3. 총액 차이 PNG (사용자 선택 간격 적용)
            difference_file = self.chart_generator.generate_total_difference_png(records, interval_months)
            print(f"   ✅ 차이 차트 저장: {difference_file}")

        except Exception as e:
            print(f"   ❌ 차트 생성 실패: {e}")
            print(f"   matplotlib 설치가 필요할 수 있습니다: pip install matplotlib pandas")

    def check_rebalancing_signals(self):
        """리밸런싱 신호 확인"""
        print("\n" + "-"*80)
        print("🎯 리밸런싱 신호 확인")
        print("-"*80 + "\n")

        records = self.data_manager.load_records()

        if not records:
            print("📭 기록이 없습니다. 메뉴 1번에서 초기 설정을 완료해주세요.")
            return

        # 최신 기록
        latest = records[0]

        print(f"📋 최신 기록: {latest.date}")
        print(f"   V값: ${latest.v_value:,.2f}")
        print(f"   평가금액(E): ${latest.e_value:,.2f}")
        print(f"   Pool: ${latest.pool:,.2f}")
        print(f"   주식수: {latest.shares:,}")
        print()

        # 신호 확인
        signal, change_rate = self.calculator.determine_signal(latest.v_value, latest.v_value)
        formatted_rate = self.calculator.format_change_rate(change_rate)

        print(f"📊 이전 V값 대비 변화: {formatted_rate}")

        # 신호별 색상 출력
        signal_messages = {
            'BUY': ('\033[92m', "매수 신호 (BUY)", "V가 상한선(15%)을 초과했습니다. 포트폴리오 비중 조정을 권장합니다."),
            'SELL': ('\033[91m', "매도 신호 (SELL)", "V가 하한선(15%)을 하회했습니다. 일부 포지션 정리를 권장합니다."),
            'HOLD': ('\033[93m', "유지 (HOLD)", "정상 범위 내입니다. 현재 전략 유지."),
            'INITIAL': ('\033[94m', "초기 설정", "초기 설정된 V값입니다.")
        }

        if latest.signal in signal_messages:
            color_code, signal_text, detail_text = signal_messages[latest.signal]
            print(f"\n{color_code}🎯 {signal_text}\033[0m")
            print(f"   {detail_text}")
        else:
            print(f"\n신호: {latest.signal}")

        # 과거 신호 통계
        if len(records) > 1:
            buy_count = sum(1 for r in records if r.signal == 'BUY')
            sell_count = sum(1 for r in records if r.signal == 'SELL')
            hold_count = sum(1 for r in records if r.signal == 'HOLD')

            print(f"\n📊 과거 신호 통계 (총 {len(records)}개):")
            print(f"   매수(BUY): {buy_count}회")
            print(f"   매도(SELL): {sell_count}회")
            print(f"   유지(HOLD): {hold_count}회")

        # 현재 가격 기준 새로운 신호 계산
        print(f"\n🔄 현재 가격으로 재계산:")
        print("현재 TQQQ 가격을 입력하면 새로운 신호를 확인할 수 있습니다.")
        try:
            current_price_input = input(f"현재 가격 (엔터 시 건너뜀, 현재 ${latest.price:.2f}): $").strip()

            if current_price_input:
                current_price = float(current_price_input)
                current_e_value = self.calculator.calculate_evaluation(current_price, latest.shares)
                current_v_value = self.calculator.calculate_v(current_e_value, latest.pool, latest.v_value)
                current_signal, current_rate = self.calculator.determine_signal(latest.v_value, current_v_value)

                print(f"\n   현재 평가금액(E): ${current_e_value:,.2f}")
                print(f"   현재 V값: ${current_v_value:,.2f}")
                print(f"   변화율: {self.calculator.format_change_rate(current_rate)}")

                if current_signal in signal_messages:
                    color_code, signal_text, detail_text = signal_messages[current_signal]
                    print(f"\n{color_code}🎯 {signal_text}\033[0m")
                    print(f"   {detail_text}")

        except ValueError:
            print("\n❌ 숫자를 올바르게 입력해주세요.")

    def run_simulation(self):
        """예약 주문 시뮬레이션"""
        print("\n" + "-"*80)
        print("🎮 예약 주문 시뮬레이션")
        print("-"*80 + "\n")

        try:
            # V값 입력 (마지막 V값 자동 사용 가능)
            latest_record = self.data_manager.get_latest_record()

            if latest_record:
                print(f"V값을 입력하세요 (±15% 밴드 자동 계산)")
                print(f"   가장 최근 V값: ${latest_record.v_value:,.2f} ({latest_record.date})")
                v_value_input = input(f"V값 ($) [엔터 시 ${latest_record.v_value:,.2f} 사용]: ").strip()

                if v_value_input:
                    v_value = float(v_value_input)
                    if v_value <= 0:
                        print("\n❌ V값은 0보다 커야 합니다.")
                        return
                else:
                    v_value = latest_record.v_value
                    print(f"   ✅ 최신 V값 사용: ${v_value:,.2f}")
            else:
                print("V값을 입력하세요 (±15% 밴드 자동 계산)")
                v_value_input = input("V값 ($): ").strip()

                if v_value_input:
                    v_value = float(v_value_input)
                    if v_value <= 0:
                        print("\n❌ V값은 0보다 커야 합니다.")
                        return
                else:
                    print("\n❌ V값을 입력해주세요.")
                    return

            # 주식수 입력 (최신 값 자동 사용 가능)
            if latest_record:
                shares_input = input(f"\n보유 주식수 [엔터 시 {latest_record.shares:,}주 사용]: ").strip()
                if shares_input:
                    shares = int(shares_input)
                    if shares < 1:
                        print("\n❌ 주식수는 1 이상이어야 합니다.")
                        return
                else:
                    shares = latest_record.shares
                    print(f"   ✅ 최신 주식수 사용: {shares:,}주")
            else:
                shares_input = input("\n보유 주식수: ").strip()
                if shares_input:
                    shares = int(shares_input)
                    if shares < 1:
                        print("\n❌ 주식수는 1 이상이어야 합니다.")
                        return
                else:
                    print("\n❌ 주식수를 입력해주세요.")
                    return

            # Pool 입력 (최신 값 자동 사용 가능)
            if latest_record:
                pool_input = input(f"현재 Pool ($) [엔터 시 ${latest_record.pool:,.2f} 사용]: ").strip()
                if pool_input:
                    pool = float(pool_input)
                    if pool < 0:
                        print("\n❌ Pool은 0 이상이어야 합니다.")
                        return
                else:
                    pool = latest_record.pool
                    print(f"   ✅ 최신 Pool 사용: ${pool:,.2f}")
            else:
                pool_input = input("현재 Pool ($): ").strip()
                if pool_input:
                    pool = float(pool_input)
                    if pool < 0:
                        print("\n❌ Pool은 0 이상이어야 합니다.")
                        return
                else:
                    print("\n❌ Pool을 입력해주세요.")
                    return

            # Pool 한도 입력 (퍼센트)
            print(f"\n현재 Pool: ${pool:,.2f}")
            pool_limit_input = input(f"Pool 한도 (%) [엔터 시 100% 사용]: ").strip()
            if pool_limit_input:
                pool_limit_percent = float(pool_limit_input)
                if pool_limit_percent < 0:
                    print("\n❌ Pool 한도는 0% 이상이어야 합니다.")
                    return
                if pool_limit_percent > 100:
                    print(f"\n⚠️  Pool 한도가 100%를 초과합니다. (입력: {pool_limit_percent}%)")
                    confirm = input("계속하시겠습니까? (y/n): ").lower()
                    if confirm != 'y':
                        return

                pool_limit = pool * (pool_limit_percent / 100)
                print(f"   ✅ Pool 한도: {pool_limit_percent}% (${pool_limit:,.2f})")
            else:
                pool_limit = pool  # 기본값: 현재 Pool 100%
                print(f"   ✅ Pool 한도: 100% (${pool_limit:,.2f})")

            # 주문 단위 입력
            shares_per_order_input = input(f"\n주문 단위 (주) [엔터 시 5주 사용]: ").strip()
            if shares_per_order_input:
                shares_per_order = int(shares_per_order_input)
                if shares_per_order < 1:
                    print("\n❌ 주문 단위는 1 이상이어야 합니다.")
                    return
            else:
                shares_per_order = 5  # 기본값: 5주
                print(f"   ✅ 기본값 5주 사용")

            # 주문 표시 옵션 선택
            print("\n주문 표시 옵션을 선택하세요:")
            print("1. 전체 보기")
            print("2. 요약 보기 (최대 20개)")
            print("3. 직접 입력")

            display_option = input("\n선택 (1-3, 엔터 시 요약 보기): ").strip()
            max_orders = 20  # 기본값

            try:
                if display_option == '1':
                    max_orders = None  # 전체 보기
                    print("   ✅ 전체 주문 표시")
                elif display_option == '2' or display_option == '':
                    max_orders = 20
                    print("   ✅ 요약 보기 (최대 20개)")
                elif display_option == '3':
                    max_input = input("최대 몇 개까지 표시하시겠습니까?: ").strip()
                    if max_input:
                        max_orders = int(max_input)
                        if max_orders < 1:
                            print("   ⚠️  1보다 작은 값은 입력할 수 없습니다. 요약 보기를 사용합니다.")
                            max_orders = 20
                        else:
                            print(f"   ✅ 최대 {max_orders}개 표시")
                    else:
                        max_orders = 20
                        print("   ✅ 요약 보기 (최대 20개)")
                else:
                    print("   ⚠️  잘못된 선택입니다. 요약 보기를 사용합니다.")
                    max_orders = 20
            except ValueError:
                print("   ⚠️  입력이 올바르지 않습니다. 요약 보기를 사용합니다.")
                max_orders = 20

            # 시뮬레이션 실행
            print("\n🔄 예약 주문 계획 수립 중...\n")

            plan = self.simulator.calculate_reservation_plan(
                v_value=v_value,
                shares=shares,
                pool=pool,
                pool_limit=pool_limit,
                shares_per_order=shares_per_order
            )

            # 결과 출력 (max_orders 옵션 적용)
            output = self.simulator.format_reservation_plan(plan, max_orders=max_orders)
            print(output)

        except ValueError:
            print("\n❌ 숫자를 올바르게 입력해주세요.")

    def view_records(self):
        """기록 조회"""
        print("\n" + "-"*80)
        print("📋 리밸런싱 기록 조회")
        print("-"*80 + "\n")

        records = self.data_manager.load_records()

        if not records:
            print("📭 리밸런싱 기록이 없습니다.")
            return

        print(f"총 {len(records)}개의 기록이 있습니다.\n")

        print(f"{'날짜':<12} {'종가':<10} {'주식수':<10} {'현금':<12} {'E':<12} {'V':<12} {'신호':<8}")
        print("-" * 80)

        for record in records:
            signal_color = self._get_signal_color(record.signal)
            print(
                f"{record.date:<12} "
                f"${record.price:<9.2f} "
                f"{record.shares:<10} "
                f"${record.pool:<11.2f} "
                f"${record.e_value:<11.2f} "
                f"${record.v_value:<11.2f} "
                f"{signal_color}{record.signal:<8}\033[0m"
            )

    def edit_records(self):
        """기록 편집"""
        print("\n" + "-"*80)
        print("✏️  리밸런싱 기록 편집")
        print("-"*80 + "\n")

        records = self.data_manager.load_records()

        if not records:
            print("📭 편집할 기록이 없습니다.")
            return

        print("편집할 기록을 선택하세요:")
        for i, record in enumerate(records):
            print(f"{i + 1}. {record.date} - ${record.v_value:,.2f} ({record.signal})")

        try:
            choice = int(input("\n선택 (번호): ")) - 1

            if choice < 0 or choice >= len(records):
                print("\n❌ 잘못된 선택입니다.")
                return

            selected_record = records[choice]

            print(f"\n선택된 기록: {selected_record.date}")
            print(f"1. 종가: ${selected_record.price}")
            print(f"2. 주식수: {selected_record.shares}")
            print(f"3. 현금: ${selected_record.pool}")
            print(f"4. 삭제")
            print(f"5. 취소")

            action = input("\n편집할 항목 (1-5): ").strip()

            if action == '1':
                new_price = float(input(f"새 종가 (현재 ${selected_record.price}): $"))
                selected_record.price = new_price

                # E, V 재계산
                e_value = self.calculator.calculate_evaluation(new_price, selected_record.shares)

                # 이전 기록의 V값 가져오기
                all_records = self.data_manager.load_records()
                previous_v = all_records[choice - 1].v_value if choice > 0 else None
                v_value = self.calculator.calculate_v(e_value, selected_record.pool, previous_v)

                # 신호 재계산 (이전 기록이 있으면 비교)
                previous_v_for_signal = all_records[choice - 1].v_value if choice > 0 else v_value
                signal, _ = self.calculator.determine_signal(previous_v_for_signal, v_value)

                selected_record.e_value = e_value
                selected_record.v_value = v_value
                selected_record.signal = signal

                if self.data_manager.update_record(choice, selected_record):
                    print("\n✅ 기록이 수정되었습니다.")

            elif action == '2':
                new_shares = int(input(f"새 주식수 (현재 {selected_record.shares}): "))

                # E, V 재계산
                e_value = self.calculator.calculate_evaluation(selected_record.price, new_shares)

                # 이전 기록의 V값 가져오기
                all_records = self.data_manager.load_records()
                previous_v = all_records[choice - 1].v_value if choice > 0 else None
                v_value = self.calculator.calculate_v(e_value, selected_record.pool, previous_v)

                # 신호 재계산 (이전 기록이 있으면 비교)
                previous_v_for_signal = all_records[choice - 1].v_value if choice > 0 else v_value
                signal, _ = self.calculator.determine_signal(previous_v_for_signal, v_value)

                selected_record.shares = new_shares
                selected_record.e_value = e_value
                selected_record.v_value = v_value
                selected_record.signal = signal

                if self.data_manager.update_record(choice, selected_record):
                    print("\n✅ 기록이 수정되었습니다.")

            elif action == '3':
                new_pool = float(input(f"새 현금 (현재 ${selected_record.pool}): $"))

                # V 재계산 (pool만 변경)
                all_records = self.data_manager.load_records()
                previous_v = all_records[choice - 1].v_value if choice > 0 else None
                v_value = self.calculator.calculate_v(selected_record.e_value, new_pool, previous_v)

                # 신호 재계산 (이전 기록이 있으면 비교)
                previous_v_for_signal = all_records[choice - 1].v_value if choice > 0 else v_value
                signal, _ = self.calculator.determine_signal(previous_v_for_signal, v_value)

                selected_record.pool = new_pool
                selected_record.v_value = v_value
                selected_record.signal = signal

                if self.data_manager.update_record(choice, selected_record):
                    print("\n✅ 기록이 수정되었습니다.")

            elif action == '4':
                confirm = input(f"\n정말 {selected_record.date} 기록을 삭제하시겠습니까? (y/n): ").lower()
                if confirm == 'y':
                    if self.data_manager.delete_record(choice):
                        print("\n✅ 기록이 삭제되었습니다.")

            elif action == '5':
                print("\n취소되었습니다.")

            else:
                print("\n❌ 잘못된 선택입니다.")

        except ValueError:
            print("\n❌ 숫자를 입력해주세요.")

    def view_price_history(self):
        """가격 히스토리 조회"""
        print("\n" + "-"*80)
        print("📊 TQQQ 가격 히스토리")
        print("-"*80 + "\n")

        prices = self.cache_manager.load_all_prices()

        if not prices:
            print("📭 가격 데이터가 없습니다.")
            print("\n옵션:")
            print("1. API에서 가져오기")
            print("2. 수동으로 입력하기")
            print("3. 메인 메뉴로 돌아가기")

            choice = input("\n선택 (1-3): ").strip()

            if choice == '1':
                price, date_str = self.price_fetcher.fetch_latest_friday_close()
                if price:
                    print(f"\n✅ {date_str} 가격이 추가되었습니다.")
            elif choice == '2':
                self._manual_price_input()
            return

        print(f"총 {len(prices)}개의 가격 데이터가 있습니다.\n")

        # 등락률 계산
        for i, price in enumerate(prices):
            if i < len(prices) - 1:
                prev_price = prices[i + 1].close_price
                change_rate = self.cache_manager.calculate_change_rate(price.close_price, prev_price)
                price.change_rate = change_rate
            else:
                price.change_rate = 0.0

        print(f"{'날짜':<12} {'종가':<12} {'등락률':<12} {'소스':<10}")
        print("-" * 80)

        for price in prices:
            # 등락률 색상
            if price.change_rate > 0:
                rate_color = '\033[92m'  # 녹색
                sign = '+'
            elif price.change_rate < 0:
                rate_color = '\033[91m'  # 빨간색
                sign = ''
            else:
                rate_color = '\033[93m'  # 노란색
                sign = ''

            print(
                f"{price.date:<12} "
                f"${price.close_price:<11.2f} "
                f"{rate_color}{sign}{price.change_rate:.2f}%\033[0m{'':<7} "
                f"{price.source:<10}"
            )

        # 통계
        stats = self.cache_manager.calculate_statistics(prices)
        if stats:
            print(f"\n📊 통계:")
            print(f"   최고가: ${stats['highest']:,.2f}")
            print(f"   최저가: ${stats['lowest']:,.2f}")
            print(f"   평균가: ${stats['average']:,.2f}")

    def _manual_price_input(self):
        """수동 가격 입력"""
        print("\n가격 데이터 수동 입력")
        try:
            date_str = input("날짜 (YYYY-MM-DD): ")
            price = float(input("TQQQ 종가: $"))

            if self.price_fetcher.fetch_price_manual(date_str, price):
                print(f"\n✅ {date_str} 가격이 추가되었습니다.")
            else:
                print("\n❌ 가격 추가에 실패했습니다.")

        except ValueError:
            print("\n❌ 날짜와 가격을 올바르게 입력해주세요.")

    def manage_round_transactions(self):
        """매수/매도 기록 관리"""
        print("\n" + "-"*80)
        print("💰 매수/매도 기록 관리")
        print("-"*80 + "\n")

        while True:
            print("메뉴를 선택하세요:")
            print("1. 기록 보기 (차수별 요약)")
            print("2. 기록 추가")
            print("3. 차수별 상세 보기")
            print("4. 메인 메뉴로 돌아가기")

            choice = input("\n선택 (1-4): ").strip()

            if choice == '1':
                self.view_rounds_summary()
            elif choice == '2':
                self.add_round_transaction()
            elif choice == '3':
                self.view_round_details()
            elif choice == '4':
                print("\n메인 메뉴로 돌아갑니다.")
                break
            else:
                print("\n❌ 잘못된 선택입니다.\n")

            if choice != '4':
                input("\n엔터 키를 누르면 계속...")

    def view_rounds_summary(self):
        """차수별 요약 보기"""
        print("\n" + "-"*80)
        print("📊 차수별 요약")
        print("-"*80 + "\n")

        rounds = self.round_manager.load_all_rounds()

        if not rounds:
            print("📭 기록된 차수가 없습니다.")
            return

        # 차수 번호순 정렬 ("1차수", "2차수", ...)
        rounds.sort(key=lambda r: int(r['round_id'].replace('차수', '')))

        print(f"총 {len(rounds)}개의 차수가 있습니다.\n")

        # 헤더
        print(f"{'차수ID':<12} {'기간':<28} {'주식수 변화':<15} {'Pool 변화':<15} {'거래수':<8}")
        print("-" * 90)

        for round_info in rounds:
            start = round_info['start_date']
            end = round_info['end_date']
            shares_change = int(round_info['shares_change'])
            pool_change = float(round_info['pool_change'])

            # 색상
            shares_color = '\033[92m' if shares_change > 0 else '\033[91m'  # +:녹색, -:빨강
            pool_color = '\033[91m' if pool_change < 0 else '\033[92m'  # -:빨강, +:녹색

            print(f"{round_info['round_id']:<12} "
                  f"{start} ~ {end:<20} "
                  f"{shares_color}{shares_change:+,}주\033[0m{'':<9} "
                  f"{pool_color}${pool_change:+,.2f}\033[0m{'':<9} "
                  f"{len(self.round_manager.load_round_transactions(round_info['round_id'])):<8}")

        print()

    def add_round_transaction(self):
        """매수/매도 기록 추가"""
        print("\n" + "-"*80)
        print("📝 기록 추가")
        print("-"*80 + "\n")

        # 최신 기록 확인
        latest_record = self.data_manager.get_latest_record()
        if not latest_record:
            print("❌ 먼저 차수를 입력해주세요 (메뉴 2번).")
            return

        # 첫 번째 기록 날짜 가져오기
        all_records = self.data_manager.load_records()
        if not all_records:
            print("❌ 기록된 데이터가 없습니다.")
            return
        first_record_date = all_records[0].date

        print(f"현재 주식수: {latest_record.shares:,}주")
        print(f"현재 Pool: ${latest_record.pool:,.2f}")
        print()

        try:
            # 거래 날짜 먼저 입력
            date_input = input("거래 날짜 (YYYY-MM-DD, 엔터 시 오늘): ").strip()
            if date_input:
                try:
                    datetime.strptime(date_input, '%Y-%m-%d')
                    trans_date = date_input
                except ValueError:
                    print("\n❌ 날짜 형식이 올바르지 않습니다.")
                    return
            else:
                trans_date = datetime.now().strftime('%Y-%m-%d')
                print(f"(오늘 날짜: {trans_date})")

            # 거래 날짜를 기준으로 차수 ID 계산 (첫 번째 기록 날짜 기준)
            round_id = self.round_manager.get_round_id(trans_date, first_record_date)
            start_date, end_date, round_num = self.round_manager.calculate_round_period(trans_date, first_record_date)

            print(f"\n차수: {round_id}")
            print(f"차수 기간: {start_date} ~ {end_date}")
            print()

            # 거래 유형 선택
            print("거래 유형을 선택하세요:")
            print("1. 매수 (BUY)")
            print("2. 매도 (SELL)")

            trans_choice = input("\n선택 (1-2): ").strip()

            if trans_choice not in ['1', '2']:
                print("\n❌ 잘못된 선택입니다.")
                return

            transaction_type = 'BUY' if trans_choice == '1' else 'SELL'

            # 주식수 입력
            shares_input = input("주식수: ").strip()
            shares = int(shares_input)

            if shares <= 0:
                print("\n❌ 주식수는 1 이상이어야 합니다.")
                return

            # 가격 입력
            price_input = input("1주당 가격 ($): ").strip()
            price = float(price_input)

            if price <= 0:
                print("\n❌ 가격은 0보다 커야 합니다.")
                return

            # 총액 계산
            total_amount = price * shares

            # 변화 계산
            if transaction_type == 'BUY':
                shares_after = latest_record.shares + shares
                pool_after = latest_record.pool - total_amount
                shares_change = shares
                pool_change = -total_amount
                notes = f"매수: {shares}주 × ${price:.2f}"
            else:  # SELL
                shares_after = latest_record.shares - shares
                pool_after = latest_record.pool + total_amount
                shares_change = -shares
                pool_change = total_amount
                notes = f"매도: {shares}주 × ${price:.2f}"

            # 확인
            print(f"\n📋 거래 내역 확인:")
            print(f"   차수 ID: {round_id}")
            print(f"   거래 날짜: {trans_date}")
            print(f"   유형: {transaction_type}")
            print(f"   주식수: {shares}주")
            print(f"   가격: ${price:.2f}")
            print(f"   총액: ${total_amount:,.2f}")
            print(f"   주식수 변화: {shares_change:+,}주 ({latest_record.shares:,} → {shares_after:,})")
            print(f"   Pool 변화: ${pool_change:+,.2f} (${latest_record.pool:,.2f} → ${pool_after:,.2f})")
            print(f"   비고: {notes}")

            confirm = input("\n위 내용으로 기록하시겠습니까? (y/n): ").lower()
            if confirm != 'y':
                print("\n취소되었습니다.")
                return

            # 기록 생성
            transaction = RoundTransaction(
                round_id=round_id,
                date=trans_date,
                transaction_type=transaction_type,
                shares=shares,
                price=price,
                total_amount=total_amount,
                shares_after=shares_after,
                pool_after=pool_after,
                notes=notes
            )

            # 거래 내역 저장
            if self.round_manager.add_transaction(transaction):
                print(f"\n✅ 거래 내역이 저장되었습니다.")

                # 차수 요약 업데이트
                latest_round = self.round_manager.get_latest_round_info()

                # 현재 차수가 없거나 다른 차수면 새로운 차수 생성
                if not latest_round or latest_round['round_id'] != round_id:
                    initial_shares = latest_record.shares
                    initial_pool = latest_record.pool
                else:
                    initial_shares = int(latest_round['initial_shares'])
                    initial_pool = float(latest_round['initial_pool'])

                # 이전 거래 내역을 모두 로드해서 최종 상태 계산
                transactions = self.round_manager.load_round_transactions(round_id)
                final_shares = initial_shares
                final_pool = initial_pool

                for trans in transactions:
                    if trans['transaction_type'] == 'BUY':
                        final_shares += int(trans['shares'])
                        final_pool -= float(trans['total_amount'])
                    else:  # SELL
                        final_shares -= int(trans['shares'])
                        final_pool += float(trans['total_amount'])

                # 차수 정보 생성
                round_info = RoundInfo(
                    round_id=round_id,
                    start_date=start_date,
                    end_date=end_date,
                    initial_shares=initial_shares,
                    initial_pool=initial_pool,
                    final_shares=final_shares,
                    final_pool=final_pool,
                    shares_change=final_shares - initial_shares,
                    pool_change=final_pool - initial_pool,
                    transactions=[]
                )

                if self.round_manager.update_round_summary(round_info):
                    print(f"✅ 차수 요약이 업데이트되었습니다.")

        except ValueError:
            print("\n❌ 숫자를 올바르게 입력해주세요.")

    def view_round_details(self):
        """차수별 상세 보기"""
        print("\n" + "-"*80)
        print("📋 차수별 상세 보기")
        print("-"*80 + "\n")

        rounds = self.round_manager.load_all_rounds()

        if not rounds:
            print("📭 기록된 차수가 없습니다.")
            return

        # 차수 번호순 정렬
        rounds.sort(key=lambda r: int(r['round_id'].replace('차수', '')))

        # 차수 선택
        print("조회할 차수를 선택하세요:")
        for i, round_info in enumerate(rounds):
            print(f"{i + 1}. {round_info['round_id']} ({round_info['start_date']} ~ {round_info['end_date']})")

        try:
            choice = int(input("\n선택 (번호): ")) - 1

            if choice < 0 or choice >= len(rounds):
                print("\n❌ 잘못된 선택입니다.")
                return

            selected_round = rounds[choice]
            round_id = selected_round['round_id']

            # 거래 내역 로드
            transactions = self.round_manager.load_round_transactions(round_id)

            print(f"\n{'='*80}")
            print(f"📊 {round_id} 상세 정보")
            print(f"{'='*80}")
            print(f"기간: {selected_round['start_date']} ~ {selected_round['end_date']}")
            print(f"초기 주식수: {int(selected_round['initial_shares']):,}주")
            print(f"초기 Pool: ${float(selected_round['initial_pool']):,.2f}")
            print(f"최종 주식수: {int(selected_round['final_shares']):,}주")
            print(f"최종 Pool: ${float(selected_round['final_pool']):,.2f}")
            print(f"주식수 변화: {int(selected_round['shares_change']):+}주")
            print(f"Pool 변화: ${float(selected_round['pool_change']):+,.2f}")
            print(f"총 거래 수: {len(transactions)}회")
            print()

            if not transactions:
                print("📭 거래 내역이 없습니다.")
                return

            # 거래 내역 표
            print(f"{'거래일':<12} {'유형':<8} {'주식수':<10} {'가격':<10} {'총액':<12}")
            print("-" * 70)

            for trans in transactions:
                trans_type_color = '\033[92m' if trans['transaction_type'] == 'BUY' else '\033[91m'
                print(f"{trans['date']:<12} "
                      f"{trans_type_color}{trans['transaction_type']:<8}\033[0m "
                      f"{int(trans['shares']):<10} "
                      f"${float(trans['price']):<10.2f} "
                      f"${float(trans['total_amount']):<12.2f}")

        except ValueError:
            print("\n❌ 숫자를 입력해주세요.")

    def reset_data(self):
        """데이터 초기화"""
        print("\n" + "-"*80)
        print("🗑️  데이터 초기화")
        print("-"*80 + "\n")

        print("⚠️  모든 데이터가 영구적으로 삭제됩니다.")
        print("   삭제할 데이터:")

        # 초기 포트폴리오 정보 표시
        initial_portfolio = self.data_manager.get_initial_portfolio()
        if initial_portfolio:
            print(f"   - 초기 포트폴리오: {initial_portfolio['initial_date']} (현금 ${initial_portfolio['initial_cash']:,.2f}, {initial_portfolio['initial_shares']:,}주)")
        else:
            print(f"   - 초기 포트폴리오: 없음")

        print(f"   - 리밸런싱 기록: {len(self.data_manager.load_records())}개")
        print(f"   - 가격 캐시: {len(self.cache_manager.load_all_prices())}개")
        print(f"   - 차수 기록: {len(self.round_manager.load_all_rounds())}개")
        print(f"   - 차수 거래 내역: {len(self.round_manager.load_round_transactions('*'))}개")

        confirm1 = input("\n정말 삭제하시겠습니까? (yes/no): ").lower()

        if confirm1 != 'yes':
            print("\n취소되었습니다.")
            return

        print("\n⚠️  한 번 더 확인합니다.")
        print("   정말로 모든 데이터를 삭제하시겠습니까?")

        confirm2 = input("\n삭제하시겠습니까? (yes/no): ").lower()

        if confirm2 == 'yes':
            self.data_manager.clear_all_records()
            self.cache_manager.clear_cache()

            # 초기 포트폴리오 파일 삭제
            if os.path.exists(DataManager.INITIAL_PORTFOLIO_CSV):
                os.remove(DataManager.INITIAL_PORTFOLIO_CSV)

            # 차수 기록 파일 삭제
            if os.path.exists(self.round_manager.rounds_csv):
                os.remove(self.round_manager.rounds_csv)

            # 차수 거래 내역 파일 삭제
            if os.path.exists(self.round_manager.transactions_csv):
                os.remove(self.round_manager.transactions_csv)

            print("\n✅ 모든 데이터가 삭제되었습니다.")
        else:
            print("\n취소되었습니다.")

    def _get_display_width(self, text: str) -> int:
        """
        텍스트의 실제 표시 너비 계산 (한글=2, 영문=1, ANSI 코드 제외)
        """
        import re

        # ANSI 이스케이프 코드 제거
        ansi_escape = re.compile(r'\033\[[0-9;]*m')
        text_without_ansi = ansi_escape.sub('', text)

        # 한글/영문 너비 계산
        width = 0
        for char in text_without_ansi:
            if ord(char) >= 0x1100 and ord(char) <= 0xFFDC:  # 한글 문자 범위
                width += 2
            elif ord(char) >= 0xAC00 and ord(char) <= 0xD7A3:  # 한글 음절 범위
                width += 2
            elif ord(char) >= 0x4E00 and ord(char) <= 0x9FFF:  # 한자 범위
                width += 2
            else:
                width += 1

        return width

    def _pad_text_korean(self, text: str, target_width: int, align: str = 'left') -> str:
        """
        한글 포함 텍스트 패딩 (실제 표시 너비 기준)

        Args:
            text: 패딩할 텍스트
            target_width: 목표 너비
            align: 정렬 방향 ('left', 'right')

        Returns:
            패딩된 텍스트
        """
        current_width = self._get_display_width(text)
        padding = max(0, target_width - current_width)
        spaces = ' ' * padding

        if align == 'right':
            return spaces + text
        else:
            return text + spaces

    def _get_signal_color(self, signal: str) -> str:
        """신호별 색상 코드 반환"""
        colors = {
            'BUY': '\033[92m',    # 녹색
            'SELL': '\033[91m',   # 빨간색
            'HOLD': '\033[93m'    # 노란색
        }
        return colors.get(signal, '')


def main():
    """메인 함수"""
    cli = ValueRebalancingCLI()
    try:
        cli.run()
    except KeyboardInterrupt:
        print("\n\n👋 프로그램이 중단되었습니다.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 오류가 발생했습니다: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
