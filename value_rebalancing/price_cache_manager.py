"""
가격 캐시 데이터 관리
"""
import os
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from models.price_cache import PriceCache


class PriceCacheManager:
    """가격 캐시 매니저"""

    PRICE_CACHE_CSV = "data/price_cache.csv"

    def __init__(self):
        """데이터 디렉토리 생성"""
        os.makedirs("data", exist_ok=True)
        self._init_csv()

    def _init_csv(self):
        """CSV 파일 초기화"""
        if not os.path.exists(self.PRICE_CACHE_CSV):
            with open(self.PRICE_CACHE_CSV, 'w', encoding='utf-8') as f:
                f.write("date,close_price,fetched_at,source\n")

    def save_price(self, price_cache: PriceCache) -> bool:
        """
        가격 데이터 저장 (중복 시 업데이트)

        Args:
            price_cache: 저장할 가격 데이터

        Returns:
            성공 여부
        """
        try:
            # 기존 데이터 확인
            prices = self.load_all_prices()

            # 동일 날짜 데이터 있는지 확인
            updated = False
            for i, p in enumerate(prices):
                if p.date == price_cache.date:
                    prices[i] = price_cache  # 업데이트
                    updated = True
                    break

            if not updated:
                prices.append(price_cache)  # 추가

            # 전체 다시 쓰기
            with open(self.PRICE_CACHE_CSV, 'w', encoding='utf-8') as f:
                f.write("date,close_price,fetched_at,source\n")
                for p in prices:
                    f.write(p.to_csv_row() + '\n')

            return True
        except Exception as e:
            print(f"❌ 가격 저장 실패: {e}")
            return False

    def load_all_prices(self) -> List[PriceCache]:
        """
        모든 가격 데이터 로드

        Returns:
            가격 리스트 (최신순)
        """
        prices = []
        try:
            with open(self.PRICE_CACHE_CSV, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for line in lines[1:]:  # 헤더 건너뛰기
                    if line.strip():
                        prices.append(PriceCache.from_csv_row(line))
        except FileNotFoundError:
            pass

        prices.sort(key=lambda x: x.date, reverse=True)
        return prices

    def get_price_by_date(self, date: str) -> Optional[PriceCache]:
        """
        특정 날짜의 가격 조회

        Args:
            date: 날짜 (YYYY-MM-DD)

        Returns:
            가격 데이터 또는 None
        """
        prices = self.load_all_prices()
        for p in prices:
            if p.date == date:
                return p
        return None

    def get_latest_price(self) -> Optional[PriceCache]:
        """
        가장 최신 가격 조회

        Returns:
            최신 가격 또는 None
        """
        prices = self.load_all_prices()
        return prices[0] if prices else None

    def get_recent_prices(self, days: int = 30) -> List[PriceCache]:
        """
        최근 N일 가격 조회

        Args:
            days: 일수

        Returns:
            최근 가격 리스트
        """
        prices = self.load_all_prices()
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        return [p for p in prices if p.date >= cutoff_date]

    def filter_by_date_range(
        self,
        start_date: str,
        end_date: str
    ) -> List[PriceCache]:
        """
        날짜 범위로 필터링

        Args:
            start_date: 시작 날짜 (YYYY-MM-DD)
            end_date: 종료 날짜 (YYYY-MM-DD)

        Returns:
            필터링된 가격 리스트
        """
        prices = self.load_all_prices()
        return [p for p in prices if start_date <= p.date <= end_date]

    def calculate_statistics(self, prices: List[PriceCache]) -> Dict:
        """
        가격 통계 계산

        Args:
            prices: 가격 리스트

        Returns:
            통계 딕셔너리
        """
        if not prices:
            return {}

        close_prices = [p.close_price for p in prices]

        return {
            'highest': max(close_prices),
            'lowest': min(close_prices),
            'average': sum(close_prices) / len(close_prices),
            'count': len(prices),
            'latest': close_prices[0] if prices else None
        }

    def calculate_change_rate(self, current: float, previous: float) -> float:
        """
        등락률 계산

        Args:
            current: 현재가
            previous: 이전가

        Returns:
            등락률 (%)
        """
        if previous == 0:
            return 0.0
        return ((current - previous) / previous) * 100

    def delete_price(self, date: str) -> bool:
        """
        특정 날짜 가격 삭제

        Args:
            date: 삭제할 날짜

        Returns:
            성공 여부
        """
        try:
            prices = self.load_all_prices()
            original_length = len(prices)
            prices = [p for p in prices if p.date != date]

            if len(prices) < original_length:
                with open(self.PRICE_CACHE_CSV, 'w', encoding='utf-8') as f:
                    f.write("date,close_price,fetched_at,source\n")
                    for p in prices:
                        f.write(p.to_csv_row() + '\n')
                return True
            return False
        except Exception as e:
            print(f"❌ 삭제 실패: {e}")
            return False

    def clear_cache(self) -> bool:
        """
        전체 캐시 초기화

        Returns:
            성공 여부
        """
        try:
            with open(self.PRICE_CACHE_CSV, 'w', encoding='utf-8') as f:
                f.write("date,close_price,fetched_at,source\n")
            return True
        except Exception as e:
            print(f"❌ 초기화 실패: {e}")
            return False

    def has_prices(self) -> bool:
        """
        가격 데이터 존재 여부 확인

        Returns:
            데이터가 있는지
        """
        return len(self.load_all_prices()) > 0
