// 주식 종가 데이터 타입
export interface DailyPrice {
  date: string // YYYY-MM-DD
  close: number // 종가
}

// API 응답 캐시 타입
interface PriceCache {
  data: DailyPrice[]
  timestamp: number
  symbol: string
}

// 캐시 저장소 키
const CACHE_KEY_PREFIX = "stock_prices_cache_"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24시간

/**
 * 내부 API를 통해 일별 종가 데이터 가져오기 (Yahoo Finance 기반, API 키 불필요)
 * @param symbol 주식 심볼 (예: "TQQQ", "SOXL")
 * @param startDate 시작일 (YYYY-MM-DD)
 * @param endDate 종료일 (YYYY-MM-DD)
 * @returns 일별 종가 데이터 배열
 */
export async function fetchDailyPrices(
  symbol: string,
  startDate: string,
  endDate: string
): Promise<DailyPrice[]> {
  // 캐시 확인
  const cache = getCachedPrices(symbol)
  if (cache && cache.data.length > 0) {
    // 캐시된 데이터를 기간에 맞게 필터링
    const filteredData = filterDataByDateRange(cache.data, startDate, endDate)
    if (filteredData.length > 0) {
      return filteredData
    }
  }

  try {
    // 더 넓은 범위로 가져오기 (주말/공휴일 대비 + Yahoo Finance 제한 대응)
    const paddedStart = new Date(startDate)
    paddedStart.setDate(paddedStart.getDate() - 30) // 30일 전부터
    const paddedEnd = new Date(endDate)
    paddedEnd.setDate(paddedEnd.getDate() + 7) // 7일 후까지

    // 내부 API 호출 (Yahoo Finance 프록시)
    const url = `/api/stock-prices?symbol=${encodeURIComponent(symbol)}&startDate=${paddedStart.toISOString().split("T")[0]}&endDate=${paddedEnd.toISOString().split("T")[0]}`
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `API 요청 실패: ${response.status}`)
    }

    const prices: DailyPrice[] = await response.json()

    // 데이터 유효성 체크
    if (!Array.isArray(prices)) {
      throw new Error("잘못된 데이터 형식")
    }

    console.log(`📊 Yahoo Finance에서 ${prices.length}개 데이터 가져옴`, {
      요청범위: `${paddedStart.toISOString().split("T")[0]} ~ ${paddedEnd.toISOString().split("T")[0]}`,
      실제날짜: prices.map(p => p.date)
    })

    // 캐시 저장 (전체 데이터)
    setCachedPrices(symbol, prices)

    // 기간에 맞게 필터링
    return filterDataByDateRange(prices, startDate, endDate)
  } catch (error) {
    console.error("종가 데이터 가져오기 에러:", error)
    throw error
  }
}

/**
 * 캐시된 종가 데이터 가져오기
 */
function getCachedPrices(symbol: string): PriceCache | null {
  if (typeof window === "undefined") return null

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${symbol}`
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null

    const cache: PriceCache = JSON.parse(cached)

    // 캐시 만료 체크
    const now = Date.now()
    if (now - cache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return cache
  } catch (error) {
    console.error("캐시 읽기 에러:", error)
    return null
  }
}

/**
 * 종가 데이터 캐시에 저장하기
 */
function setCachedPrices(symbol: string, prices: DailyPrice[]): void {
  if (typeof window === "undefined") return

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${symbol}`
    const cache: PriceCache = {
      data: prices,
      timestamp: Date.now(),
      symbol,
    }
    localStorage.setItem(cacheKey, JSON.stringify(cache))
  } catch (error) {
    console.error("캐시 저장 에러:", error)
  }
}

/**
 * 날짜 범위로 데이터 필터링
 */
function filterDataByDateRange(
  data: DailyPrice[],
  startDate: string,
  endDate: string
): DailyPrice[] {
  const start = new Date(startDate)
  const end = new Date(endDate)

  return data.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= start && itemDate <= end
  })
}

/**
 * 캐시 무효화 (테스트용)
 */
export function clearPriceCache(symbol: string): void {
  if (typeof window === "undefined") return

  const cacheKey = `${CACHE_KEY_PREFIX}${symbol}`
  localStorage.removeItem(cacheKey)
}

/**
 * 특정 날짜의 종가 가져오기
 */
export async function fetchPriceForDate(symbol: string, date: string): Promise<number | null> {
  try {
    // 주어진 날짜 전후 7일간 데이터 가져오기
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - 7)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 7)

    const prices = await fetchDailyPrices(
      symbol,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    )

    // 정확한 날짜 찾기
    const exactMatch = prices.find((p) => p.date === date)
    if (exactMatch) return exactMatch.close

    // 정확한 날짜가 없으면 가장 가까운 이전 날짜 찾기
    const previousDay = prices
      .filter((p) => new Date(p.date) <= new Date(date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    return previousDay?.close || null
  } catch (error) {
    console.error("특정 날짜 종가 가져오기 에러:", error)
    return null
  }
}
