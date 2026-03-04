import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        currency: string
        symbol: string
        exchangeName: string
        instrumentType: string
        firstTradeDate: number
        regularMarketTime: number
        gmtoffset: number
        timezone: string
        exchangeTimezoneName: string
        regularMarketPrice: number
        chartPreviousClose: number
        priceHint: number
        currentTradingPeriod: {
          pre: {
            timezone: string
            end: number
            start: number
          }
          regular: {
            timezone: string
            end: number
            start: number
          }
          post: {
            timezone: string
            end: number
            start: number
          }
        }
        dataGranularity: string
        range: string
        validRanges: string[]
      }
      timestamp: number[]
      indicators: {
        quote: Array<{
          open: number[]
          high: number[]
          low: number[]
          close: number[]
          volume: number[]
        }>
        adjclose: Array<{
          adjclose: number[]
        }>
      }
    }>
    error: Record<string, unknown> | null
  }
}

interface DailyPrice {
  date: string
  close: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get("symbol")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!symbol || !startDate || !endDate) {
      return NextResponse.json(
        { error: "symbol, startDate, endDate 파라미터가 필요합니다" },
        { status: 400 }
      )
    }

    // Yahoo Finance Chart API 호출
    // UNIX timestamp 변환 (일 단위)
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d&events=history`

    const response = await fetch(yahooUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API 요청 실패: ${response.status}`)
    }

    const data: YahooChartResponse = await response.json()

    // 에러 체크
    if (data.chart.error) {
      throw new Error(`Yahoo Finance API 에러: ${JSON.stringify(data.chart.error)}`)
    }

    if (!data.chart.result || data.chart.result.length === 0) {
      throw new Error("데이터를 찾을 수 없습니다")
    }

    const result = data.chart.result[0]
    const timestamps = result.timestamp
    const closes = result.indicators.quote[0].close

    // 데이터 변환 전 로그
    console.log(`📊 Yahoo Finance API 응답 (${symbol}):`, {
      요청범위: `${startDate} ~ ${endDate}`,
      응답데이터수: timestamps.length,
      첫날짜: timestamps.length > 0 ? new Date(timestamps[0] * 1000).toISOString().split("T")[0] : null,
      마지막날짜: timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1] * 1000).toISOString().split("T")[0] : null,
    })

    // 데이터 변환
    const prices: DailyPrice[] = timestamps
      .map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split("T")[0],
        close: closes[index] || 0,
      }))
      .filter((price) => price.close > 0) // 유효한 데이터만 필터링
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    console.log(`📊 변환 후 데이터:`, {
      총개수: prices.length,
      날짜들: prices.map(p => p.date)
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error("주식 가격 가져오기 에러:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "데이터 가져오기 실패",
      },
      { status: 500 }
    )
  }
}
