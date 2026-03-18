"""
예약 주문 시뮬레이터
V값 기준으로 1주당 예약 주문 가격 계산
"""
from typing import List, Dict, Tuple
from calculator import ValueCalculator


class ReservationOrderSimulator:
    """예약 주문 시뮬레이터"""

    def __init__(self):
        self.calculator = ValueCalculator()

    def calculate_reservation_plan(
        self,
        v_value: float,
        shares: int,
        pool: float,
        pool_limit: float,
        shares_per_order: int = 1
    ) -> Dict:
        """
        예약 주문 계획 수립

        Args:
            v_value: 현재 V값
            shares: 현재 보유 주식수
            pool: 현재 Pool
            pool_limit: Pool 한도
            shares_per_order: 한 주문당 주식수 (기본값: 1주)

        Returns:
            BUY/SELL 시나리오별 예약 주문 계획
        """
        # V값 ±15% 계산
        v_value_min = v_value * 0.85  # 매수 밴드
        v_value_max = v_value * 1.15  # 매도 밴드

        # BUY 시나리오 계획 (최소 밴드)
        buy_plan = self._create_buy_plan(
            v_value=v_value_min,
            shares=shares,
            pool=pool,
            pool_limit=pool_limit,
            shares_per_order=shares_per_order
        )

        # SELL 시나리오 계획 (최대 밴드)
        sell_plan = self._create_sell_plan(
            v_value=v_value_max,
            shares=shares,
            pool=pool,
            pool_limit=pool_limit,
            shares_per_order=shares_per_order
        )

        return {
            'input_summary': {
                'v_value': v_value,
                'v_value_min': v_value_min,
                'v_value_max': v_value_max,
                'shares': shares,
                'pool': pool,
                'pool_limit': pool_limit,
                'shares_per_order': shares_per_order
            },
            'buy_scenario': buy_plan,
            'sell_scenario': sell_plan
        }

    def _create_buy_plan(
        self,
        v_value: float,
        shares: int,
        pool: float,
        pool_limit: float,
        shares_per_order: int
    ) -> Dict:
        """BUY 시나리오 예약 주문 계획 (최소 밴드)"""
        orders = []
        current_shares = float(shares)  # float으로 변환하여 정확한 계산
        initial_pool = pool  # 초기 pool 저장

        # pool_limit만큼만 사용 가능
        available_pool = min(pool, pool_limit)
        current_pool = available_pool

        order_num = 1

        # Pool 한도 내에서 N주씩 매수
        while current_pool > 0:
            # 1주당 가격 = V값 / 현재 주식수
            price_per_share = v_value / current_shares

            # N주 매수 가격
            total_cost = price_per_share * shares_per_order

            # Pool 한도 체크
            if current_pool < total_cost:
                break

            # N주 매수 (주식수 증가, Pool 차감)
            current_pool -= total_cost
            current_shares += shares_per_order

            orders.append({
                'order_num': order_num,
                'price': round(price_per_share, 2),
                'shares': shares_per_order,
                'total_amount': round(total_cost, 2),
                'pool_after': round(initial_pool - (available_pool - current_pool), 2),  # 전체 pool에서 사용한 만큼 차감하여 표시
                'shares_after': int(current_shares)  # 정수로 변환하여 표시
            })

            order_num += 1

            # 안전장치: 무한 루프 방지
            if order_num > 10000:
                break

        total_shares_bought = len(orders) * shares_per_order
        total_used = available_pool - current_pool

        return {
            'v_value': v_value,
            'initial_shares': shares,
            'initial_pool': pool,
            'pool_limit': pool_limit,
            'available_pool': available_pool,  # 실제 사용 가능한 pool
            'shares_per_order': shares_per_order,
            'total_orders': len(orders),
            'total_shares_to_buy': total_shares_bought,
            'total_used': total_used,  # 실제 사용한 pool
            'final_pool': round(initial_pool - total_used, 2),  # 전체 pool에서 사용한 만큼 차감
            'final_shares': int(current_shares),
            'orders': orders
        }

    def _create_sell_plan(
        self,
        v_value: float,
        shares: int,
        pool: float,
        pool_limit: float,
        shares_per_order: int
    ) -> Dict:
        """SELL 시나리오 예약 주문 계획 (최대 밴드)"""
        orders = []
        current_shares = float(shares)  # float으로 변환하여 정확한 계산
        current_pool = pool
        order_num = 1

        # 보유 주식의 30%까지만 매도 (리밸런싱 원칙)
        max_sellable = int(shares * 0.3)
        sold_count = 0

        # 30% 범위 내에서 N주씩 매도
        while sold_count < max_sellable and current_shares >= shares_per_order:
            # 1주당 가격 = V값 / 현재 주식수
            price_per_share = v_value / current_shares

            # N주 매도 가격
            total_amount = price_per_share * shares_per_order

            # N주 매도
            current_pool += total_amount
            current_shares -= shares_per_order
            sold_count += shares_per_order

            orders.append({
                'order_num': order_num,
                'price': round(price_per_share, 2),
                'shares': shares_per_order,
                'total_amount': round(total_amount, 2),
                'pool_after': round(current_pool, 2),
                'shares_after': int(current_shares)  # 정수로 변환하여 표시
            })

            order_num += 1

            # 안전장치: 무한 루프 방지
            if order_num > 10000:
                break

        total_shares_sold = len(orders) * shares_per_order

        return {
            'v_value': v_value,
            'initial_shares': shares,
            'initial_pool': pool,
            'pool_limit': pool_limit,
            'sell_ratio': 0.3,
            'shares_per_order': shares_per_order,
            'total_orders': len(orders),
            'total_shares_to_sell': total_shares_sold,
            'final_pool': round(current_pool, 2),
            'orders': orders
        }

    def format_reservation_plan(self, plan: Dict, max_orders: int = 20) -> str:
        """
        예약 주문 계획 포맷팅

        Args:
            plan: 예약 주문 계획
            max_orders: 최대 표시 주문 수 (None이면 전체 표시)

        Returns:
            포맷팅된 문자열
        """
        output = []
        summary = plan['input_summary']

        # 입력 요약
        output.append("=" * 80)
        output.append("📊 입력 값")
        output.append("=" * 80)
        output.append(f"V값: ${summary['v_value']:,.2f}")
        output.append(f"  → 매수 밴드 (-15%): ${summary['v_value_min']:,.2f}")
        output.append(f"  → 매도 밴드 (+15%): ${summary['v_value_max']:,.2f}")
        output.append(f"보유 주식수: {summary['shares']:,}주")
        output.append(f"현재 Pool: ${summary['pool']:,.2f}")
        output.append(f"Pool 한도: ${summary['pool_limit']:,.2f}")
        output.append(f"주문 단위: {summary['shares_per_order']}주")
        output.append("")

        # BUY 시나리오
        buy = plan['buy_scenario']
        output.append("=" * 80)
        output.append("\033[91m" + "📈 BUY 시나리오 (최소 밴드)" + "\033[0m")  # 빨간색
        output.append("=" * 80)
        output.append(f"V값: ${buy['v_value']:,.2f}")
        output.append(f"초기 주식수: {buy['initial_shares']:,}주")
        output.append(f"전체 Pool: ${buy['initial_pool']:,.2f}")
        output.append(f"Pool 한도: ${buy['pool_limit']:,.2f}")
        output.append(f"사용 가능 Pool: ${buy['available_pool']:,.2f}")
        output.append(f"주문 단위: {buy['shares_per_order']}주")

        if buy['total_orders'] == 0:
            output.append("\n⚠️  Pool이 부족하여 매수 주문을 생성할 수 없습니다")
        else:
            output.append(f"총 매수 회수: {buy['total_orders']:,}회")
            output.append(f"총 매수 주식수: {buy['total_shares_to_buy']:,}주")
            output.append(f"총 사용 금액: ${buy['total_used']:,.2f}")
            output.append(f"최종 Pool: ${buy['final_pool']:,.2f} (전체 - 사용)")
            output.append(f"최종 주식수: {buy['final_shares']:,}주")
            output.append("")
            output.append(f"{'주문':<6} {'예약가':<12} {'주식수':<8} {'금액':<15} {'Pool변화':<15} {'주식수변화':<12}")
            output.append("-" * 80)

            # 매수는 계산 순서대로 표시
            if max_orders is None:
                # 전체 표시
                for order in buy['orders']:
                    output.append(
                        f"{order['order_num']:<6} "
                        f"\033[91m${order['price']:<11.2f}\033[0m "  # 빨간색 (매수 예약가)
                        f"{order['shares']:<8} "
                        f"${order['total_amount']:<14.2f} "
                        f"${order['pool_after']:<14.2f} "
                        f"{order['shares_after']:<12}주"
                    )
            else:
                # 요약 표시
                for order in buy['orders'][:max_orders]:
                    output.append(
                        f"{order['order_num']:<6} "
                        f"\033[91m${order['price']:<11.2f}\033[0m "  # 빨간색 (매수 예약가)
                        f"{order['shares']:<8} "
                        f"${order['total_amount']:<14.2f} "
                        f"${order['pool_after']:<14.2f} "
                        f"{order['shares_after']:<12}주"
                    )

                if len(buy['orders']) > max_orders:
                    output.append(f"... (총 {len(buy['orders']):,}회 중 {max_orders}회만 표시)")

        output.append("")

        # SELL 시나리오
        sell = plan['sell_scenario']
        output.append("=" * 80)
        output.append("\033[94m" + "📉 SELL 시나리오 (최대 밴드)" + "\033[0m")  # 파란색
        output.append("=" * 80)
        output.append(f"V값: ${sell['v_value']:,.2f}")
        output.append(f"초기 주식수: {sell['initial_shares']:,}주")
        output.append(f"초기 Pool: ${sell['initial_pool']:,.2f}")
        output.append(f"매도 비율: {sell['sell_ratio']*100:.0f}% (최대 {int(sell['initial_shares'] * sell['sell_ratio']):,}주)")
        output.append(f"주문 단위: {sell['shares_per_order']}주")

        if sell['total_orders'] == 0:
            output.append("\n⚠️  보유 주식이 없어 매도 주문을 생성할 수 없습니다")
        else:
            output.append(f"총 매도 회수: {sell['total_orders']:,}회")
            output.append(f"총 매도 주식수: {sell['total_shares_to_sell']:,}주")
            output.append(f"최종 Pool: ${sell['final_pool']:,.2f}")
            output.append("")
            output.append(f"{'주문':<6} {'예약가':<12} {'주식수':<8} {'금액':<15} {'Pool변화':<15} {'주식수변화':<12}")
            output.append("-" * 80)

            if max_orders is None:
                # 전체 표시
                for order in sell['orders']:
                    output.append(
                        f"{order['order_num']:<6} "
                        f"\033[94m${order['price']:<11.2f}\033[0m "  # 파란색 (매도 예약가)
                        f"{order['shares']:<8} "
                        f"${order['total_amount']:<14.2f} "
                        f"${order['pool_after']:<14.2f} "
                        f"{order['shares_after']:<12}주"
                    )
            else:
                # 요약 표시
                for order in sell['orders'][:max_orders]:
                    output.append(
                        f"{order['order_num']:<6} "
                        f"\033[94m${order['price']:<11.2f}\033[0m "  # 파란색 (매도 예약가)
                        f"{order['shares']:<8} "
                        f"${order['total_amount']:<14.2f} "
                        f"${order['pool_after']:<14.2f} "
                        f"{order['shares_after']:<12}주"
                    )

                if len(sell['orders']) > max_orders:
                    output.append(f"... (총 {len(sell['orders']):,}회 중 {max_orders}회만 표시)")

        output.append("")
        output.append("=" * 80)
        output.append("📝 계산 방식")
        output.append("=" * 80)
        output.append(f"• 1주당 예약가 = V값 ÷ 현재 주식수")
        output.append(f"• N주당 금액 = 1주당 예약가 × {summary['shares_per_order']}주")
        output.append("• 매수: 사용 가능 Pool 차감, 주식수 증가 (Pool 한도 내에서 반복)")
        output.append("• 매도: Pool 증가, 주식수 감소 (보유 주식의 30% 한도)")
        output.append(f"• 각 주문 후 주식수 변화 → 다음 주문 가격 재계산")
        output.append("")

        # 표시 옵션 정보
        if max_orders is None:
            output.append("📋 표시: 전체 주문")
        else:
            output.append(f"📋 표시: 최대 {max_orders}개 주문")

        output.append("")

        return "\n".join(output)


# 호환성을 위해 이전 클래스명 유지
Week5PurchaseSimulator = ReservationOrderSimulator