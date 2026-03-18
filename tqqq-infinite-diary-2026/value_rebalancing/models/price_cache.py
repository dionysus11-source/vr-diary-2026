"""
가격 캐시 데이터 모델
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class PriceCache:
    """가격 캐시"""
    date: str  # YYYY-MM-DD
    close_price: float  # 종가
    fetched_at: str  # 조회 시간 ISO 타임스탬프
    source: str  # API/Manual

    def to_csv_row(self) -> str:
        """CSV 행으로 변환"""
        return f"{self.date},{self.close_price},{self.fetched_at},{self.source}"

    @classmethod
    def from_csv_row(cls, row: str) -> 'PriceCache':
        """CSV 행에서 객체 생성"""
        parts = row.strip().split(',')
        return cls(
            date=parts[0],
            close_price=float(parts[1]),
            fetched_at=parts[2] if len(parts) > 2 else datetime.now().isoformat(),
            source=parts[3] if len(parts) > 3 else "API"
        )

    def is_expired(self, days: int = 7) -> bool:
        """캐시 만료 여부 확인"""
        try:
            fetched_time = datetime.fromisoformat(self.fetched_at)
            age_days = (datetime.now() - fetched_time).days
            return age_days > days
        except:
            return True
