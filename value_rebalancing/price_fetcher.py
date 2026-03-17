"""
TQQQ 가격 데이터 조회 (야후 파이낸스 API)
"""
from datetime import datetime, timedelta, date
from typing import Optional, Tuple
from models.price_cache import PriceCache
from price_cache_manager import PriceCacheManager


class PriceFetcher:
    """TQQQ 가격 조회기"""

    def __init__(self, cache_manager: PriceCacheManager):
        """
        초기화

        Args:
            cache_manager: 가격 캐시 매니저
        """
        self.cache_manager = cache_manager
        self.tqqq_symbol = "TQQQ"

    def fetch_latest_friday_close(self) -> Tuple[Optional[float], Optional[str]]:
        """
        가장 최근 금요일 종가 조회

        Returns:
            (종가, 날짜) 또는 (None, None)
        """
        # 1. 캐시 확인
        latest_cache = self.cache_manager.get_latest_price()
        if latest_cache and not latest_cache.is_expired(days=7):
            print(f"✅ 캐시된 가격 사용 ({latest_cache.date})")
            return latest_cache.close_price, latest_cache.date

        # 2. API 시도
        try:
            import yfinance as yf

            # 최근 금요일 날짜 계산
            today = date.today()
            days_since_friday = (today.weekday() - 4) % 7  # 금요일=4
            if days_since_friday == 0 and datetime.now().hour < 16:  # 금요일 오후 4시 이전
                days_since_friday = 7  # 지난주 금요일

            last_friday = today - timedelta(days=days_since_friday)

            # TQQQ 가격 조회
            print(f"📡 야후 파이낸스 API에서 TQQQ 가격 조회 중...")
            tqqq = yf.Ticker(self.tqqq_symbol)

            # 최근 데이터 가져오기 (최근 1개월)
            hist = tqqq.history(period="1mo")

            if hist.empty:
                print("❌ API에서 데이터를 찾을 수 없습니다.")
                return None, None

            # 가장 최근 금요일 찾기 (역순으로 탐색)
            for i in range(len(hist)):
                hist_date = hist.index[-i-1].date()
                if hist_date.weekday() == 4:  # 금요일 (0=월, 4=금)
                    date_str = hist_date.strftime('%Y-%m-%d')
                    close_price = float(hist['Close'].iloc[-i-1])

                    # 캐시 저장
                    price_cache = PriceCache(
                        date=date_str,
                        close_price=close_price,
                        fetched_at=datetime.now().isoformat(),
                        source='API'
                    )
                    self.cache_manager.save_price(price_cache)

                    print(f"✅ {date_str} (금요일) TQQQ 종가: ${close_price:.2f}")
                    return close_price, date_str

            print("❌ 최근 금요일 가격을 찾을 수 없습니다.")
            return None, None

        except ImportError:
            print("❌ yfinance 라이브러리가 설치되지 않았습니다.")
            print("   설치: pip install yfinance")
            return None, None
        except Exception as e:
            print(f"❌ API 조회 실패: {e}")
            return None, None

    def fetch_price_manual(self, target_date: str, price: float) -> bool:
        """
        수동으로 가격 입력

        Args:
            target_date: 날짜 (YYYY-MM-DD)
            price: 종가

        Returns:
            성공 여부
        """
        try:
            price_cache = PriceCache(
                date=target_date,
                close_price=price,
                fetched_at=datetime.now().isoformat(),
                source='Manual'
            )
            return self.cache_manager.save_price(price_cache)
        except Exception as e:
            print(f"❌ 수동 입력 실패: {e}")
            return False

    def get_friday_price_with_fallback(self) -> Tuple[Optional[float], Optional[str]]:
        """
        금요일 종가 조회 (API 실패 시 캐시 대체)

        Returns:
            (종가, 날짜) 또는 (None, None)
        """
        # API 시도
        price, date_str = self.fetch_latest_friday_close()

        if price is not None:
            return price, date_str

        # API 실패 시 캐시 확인
        latest_cache = self.cache_manager.get_latest_price()
        if latest_cache:
            print(f"\n⚠️  API 연결 실패. 캐시된 데이터를 사용합니다.")
            print(f"   캐시 날짜: {latest_cache.date}")

            # 만료 경고
            if latest_cache.is_expired(days=7):
                print(f"   ⚠️  캐시된 데이터가 7일 이상 되었습니다.")
                print(f"   가능하면 인터넷 연결 후 최신 가격을 가져오세요.")

            response = input("\n캐시된 가격을 사용하시겠습니까? (y/n): ").lower()
            if response == 'y':
                return latest_cache.close_price, latest_cache.date

        return None, None
