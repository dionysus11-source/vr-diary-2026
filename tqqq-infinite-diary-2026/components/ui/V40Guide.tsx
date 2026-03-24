"use client"

import { Round } from "@/types"
import { getV4GuideInfo } from "@/lib/calculations/v4-guide"
import { formatAmount, formatPrice } from "@/lib/data/trades"

interface V40GuideProps {
  round: Round
}

export function V40Guide({ round }: V40GuideProps) {
  const guideInfo = getV4GuideInfo(round)
  const { 
    mode, state, tValue, starPercentage, tryAmount, averagePrice, starPoint, sellPoint,
    locBuyQuantityAverage, locBuyQuantityStar, quarterSellShares, remainingSellShares,
    reverseSellShares, reverseBuyAmount, splitCount, remainingBudget
  } = guideInfo

  const { remainingQuantity } = round

  if (round.status === "completed" || remainingQuantity === 0) {
    return null
  }

  const getBadgeStyle = () => {
    switch (state) {
      case "normalFirstHalf":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "normalSecondHalf":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "reverseFirstDay":
      case "reverseNextDays":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTitle = () => {
    switch (state) {
      case "normalFirstHalf":
        return "일반모드 (전반)"
      case "normalSecondHalf":
        return "일반모드 (후반)"
      case "reverseFirstDay":
        return "리버스모드 (첫날)"
      case "reverseNextDays":
        return "리버스모드 (진행중)"
      default:
        return mode
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            무한매수 4.0 가이드
            <span className="text-sm font-medium text-gray-500">[{splitCount}분할]</span>
          </h3>
          <div className="flex items-center mt-1 gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">CURRENT STATE</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getBadgeStyle()}`}>
              {getTitle()}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
              T값
              <div className="group relative cursor-help">
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute right-0 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg border border-gray-700">
                  <p className="font-semibold mb-1">T값 (진행 회차)</p>
                  <p className="mb-1 text-gray-300">내 원금이 얼마나 들어갔는지 나타내는 지표</p>
                  <p className="text-gray-400 mt-2">현재 남은 예산: {formatAmount(remainingBudget)}</p>
                </div>
              </div>
            </div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {tValue.toFixed(2)} 회
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
              별지점(★)
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(starPoint)}
              <span className="text-xs ml-1 font-normal text-gray-500">({starPercentage > 0 ? starPercentage.toFixed(2) + "%" : "평균단가 기준"})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* 매수 가이드 */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-lg">
          <h4 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
            매수 예약 (LOC)
          </h4>

          {mode === "일반모드" ? (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-200 shadow-sm">
                <div className="text-xs text-red-600 mb-1 font-bold">오늘의 1회 시도액</div>
                <div className="text-lg font-bold">
                  {formatAmount(tryAmount)}
                </div>
              </div>

              {state === "normalFirstHalf" && (
                <>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1 font-semibold flex justify-between">
                      <span>평단 LOC 매수</span>
                      <span className="text-xs text-gray-400">시도액의 절반</span>
                    </div>
                    <div className="text-lg font-bold">
                      {formatPrice(averagePrice)} <span className="text-sm font-medium text-red-600">× {locBuyQuantityAverage}개</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1 font-semibold flex justify-between">
                      <span>별지점 LOC 매수</span>
                      <span className="text-xs text-gray-400">나머지 절반</span>
                    </div>
                    <div className="text-lg font-bold">
                      {formatPrice(starPoint)} <span className="text-sm font-medium text-red-600">× {locBuyQuantityStar}개</span>
                    </div>
                  </div>
                </>
              )}

              {state === "normalSecondHalf" && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-semibold flex justify-between">
                    <span>별지점 LOC 매수</span>
                    <span className="text-xs text-gray-400">시도액 전체</span>
                  </div>
                  <div className="text-lg font-bold">
                    {formatPrice(starPoint)} <span className="text-sm font-medium text-red-600">× {(locBuyQuantityAverage || 0) + (locBuyQuantityStar || 0)}개</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    전액 별지점 매수로 평단을 낮춥니다
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-200 shadow-sm">
                <div className="text-xs text-red-600 mb-1 font-bold">쿼터 매수 (위기 관리)</div>
                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  매수 필요 금액: {formatAmount(reverseBuyAmount)}
                </div>
                <div className="text-xs mt-1 text-gray-500">별지점 아래로 하락 시 매수 체결</div>
              </div>
            </div>
          )}
        </div>

        {/* 매도 가이드 */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg">
          <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
            매도 예약
          </h4>

          {mode === "일반모드" ? (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 shadow-sm">
                <div className="text-xs text-blue-600 mb-1 font-semibold flex items-center justify-between">
                  <span>쿼터 매도 (별지점 LOC)</span>
                  <span className="text-gray-400 text-xs">보유량의 1/4</span>
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(starPoint)} <span className="text-sm font-medium text-blue-600">× {quarterSellShares}주</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="text-xs text-blue-500 mb-1 font-semibold flex items-center justify-between">
                  <span>수익 확정 (지정가 매도)</span>
                  <span className="text-gray-400 text-xs">나머지 전체</span>
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(sellPoint)} <span className="text-sm font-medium text-blue-600">× {remainingSellShares}주</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  프리장~애프터장 유지 필수
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-200 shadow-sm">
                <div className="text-xs text-red-600 mb-1 font-bold">손절 매도 (리버스 모드)</div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  직전 보유수량의 1/{splitCount === 20 ? "10" : "20"} 매도
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(starPoint)} <span className="text-xs font-normal text-gray-500">별지점 이상일 때 매도</span>
                  <span className="text-sm font-medium text-blue-600 block">× {reverseSellShares}주 예약</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  리버스 돌입 첫날인 경우, 시장가(MOC)로 무조건 매도하세요.
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">일반모드 복귀 조건</div>
                <div className="text-sm font-medium">단가가 회복되면 자동 종료 후 복귀</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
