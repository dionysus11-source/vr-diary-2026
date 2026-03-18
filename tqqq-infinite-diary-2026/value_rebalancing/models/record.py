"""
리밸런싱 기록 데이터 모델
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class RebalancingRecord:
    """리밸런싱 기록"""
    date: str  # YYYY-MM-DD
    price: float  # TQQQ 종가
    shares: int  # 주식수 (VR)
    pool: float  # 현금 (VR)
    e_value: float  # 평가금액 (E = 종가 × 주식수)
    v_value: float  # 계산된 V값
    signal: str  # BUY/SELL/HOLD
    benchmark_shares: float  # 벤치마크 주식수 (초기 전액 TQQQ 투자)
    benchmark_value: float  # 벤치마크 가치 (benchmark_shares * 현재 종가)
    created_at: str  # ISO 타임스탬프

    def to_csv_row(self) -> str:
        """CSV 행으로 변환"""
        return f"{self.date},{self.price},{self.shares},{self.pool},{self.e_value},{self.v_value},{self.signal},{self.benchmark_shares},{self.benchmark_value},{self.created_at}"

    @classmethod
    def from_csv_row(cls, row: str) -> 'RebalancingRecord':
        """CSV 행에서 객체 생성"""
        parts = row.strip().split(',')

        # 필드 이름 변경에 따른 호환성 처리
        if len(parts) >= 10:
            # 새로운 형식 (E/V)
            return cls(
                date=parts[0],
                price=float(parts[1]),
                shares=int(parts[2]),
                pool=float(parts[3]),
                e_value=float(parts[4]),
                v_value=float(parts[5]),
                signal=parts[6],
                benchmark_shares=float(parts[7]),
                benchmark_value=float(parts[8]),
                created_at=parts[9] if len(parts) > 9 else datetime.now().isoformat()
            )
        else:
            # 이전 데이터 형식 (v1/v2) → E/V로 변환
            return cls(
                date=parts[0],
                price=float(parts[1]),
                shares=int(parts[2]),
                pool=float(parts[3]),
                e_value=float(parts[4]),  # v1 → E
                v_value=float(parts[5]),  # v2 → V
                signal=parts[6],
                benchmark_shares=float(parts[7]) if len(parts) > 7 else 0.0,
                benchmark_value=float(parts[8]) if len(parts) > 8 else 0.0,
                created_at=parts[9] if len(parts) > 9 else datetime.now().isoformat()
            )
