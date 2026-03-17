"""
밸류 리밸런싱 계산 로직
"""
import math
from typing import Tuple, Literal


class ValueCalculator:
    """밸류 리밸런싱 계산기"""

    # 상수
    G = 10  # G값 고정
    SQRT_G = math.sqrt(G)  # √10 ≈ 3.162

    @classmethod
    def calculate_v(
        cls,
        e_value: float,
        pool: float,
        previous_v: float = None
    ) -> float:
        """
        V 계산
        v2 = v1 + (pool/G) + (e-v1)/6.32

        Args:
            e_value: 평가금액 (E = 종가 × 주식수)
            pool: 현금
            previous_v: 이전 V값 (초기값이 없는 경우 None)

        Returns:
            계산된 V 값
        """
        if previous_v is None:
            # 초기값인 경우: V = E + (pool/G)
            v_value = e_value + (pool / cls.G)
        else:
            # 라오어 밸류 리밸런싱 공식
            # v2 = v1 + (pool/10) + (e-v1)/6.32
            v_value = previous_v + (pool / cls.G) + ((e_value - previous_v) / 6.32)

        return round(v_value, 2)

    @classmethod
    def calculate_evaluation(cls, price: float, shares: int) -> float:
        """
        평가금액 계산
        E = 종가 × 주식수

        Args:
            price: TQQQ 종가
            shares: 주식수

        Returns:
            평가금액
        """
        return round(price * shares, 2)

    @classmethod
    def determine_signal(
        cls,
        previous_v: float,
        current_v: float
    ) -> Tuple[Literal['BUY', 'SELL', 'HOLD'], float]:
        """
        리밸런싱 신호 판별
        현재 V가 이전 V 대비 ±15% 범위를 벗어나는지 확인

        Args:
            previous_v: 이전 V값
            current_v: 현재 V값

        Returns:
            (신호, 변화율)
        """
        if previous_v == 0:
            return 'HOLD', 0.0

        change_rate = (current_v - previous_v) / previous_v

        upper_bound = 0.15  # +15%
        lower_bound = -0.15  # -15%

        if change_rate > upper_bound:
            return 'BUY', change_rate
        elif change_rate < lower_bound:
            return 'SELL', change_rate
        else:
            return 'HOLD', change_rate

    @classmethod
    def format_change_rate(cls, rate: float) -> str:
        """
        변화율을 포맷팅

        Args:
            rate: 변화율 (소수점, 예: 0.15)

        Returns:
            포맷팅된 문자열 (예: "+15.00%")
        """
        sign = "+" if rate >= 0 else ""
        return f"{sign}{rate * 100:.2f}%"


if __name__ == "__main__":
    # 테스트
    calc = ValueCalculator()

    # 평가금액 계산 테스트
    eval_amount = calc.calculate_evaluation(45.32, 100)
    print(f"평가금액: ${eval_amount:,.2f}")

    # V2 계산 테스트
    v1 = 100000  # 이전 V값
    pool = 50000  # 현금
    v2 = calc.calculate_value2(v1, pool, eval_amount)
    print(f"V2: ${v2:,.2f}")

    # 신호 판별 테스트
    signal, rate = calc.determine_signal(v1, v2)
    print(f"신호: {signal}, 변화율: {calc.format_change_rate(rate)}")
