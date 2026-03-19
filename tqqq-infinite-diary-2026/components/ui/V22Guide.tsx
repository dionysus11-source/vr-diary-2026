"use client"

import { Round } from "@/types"
import { getV22GuideInfo, applyPercentage } from "@/lib/calculations/v22-guide"
import { formatAmount, formatPrice } from "@/lib/data/trades"

interface V22GuideProps {
  round: Round
}

export function V22Guide({ round }: V22GuideProps) {
  const guideInfo = getV22GuideInfo(round)
  const { state, tValue, starPercentage, tryAmount, averagePrice, buyPoint, sellPoint, locAverageQuantity, locStarQuantity, quarterSellShares, remainingSellShares } = guideInfo
  const { remainingQuantity } = round

  if (round.status === "completed" || remainingQuantity === 0) {
    return null
  }

  const getBadgeStyle = () => {
    switch (state) {
      case "firstHalf":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "secondHalf":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "quarterStopLoss":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // 매수/매도 포인트 계산 설명
  const getPointCalculation = () => {
    return `${averagePrice.toFixed(2)} + ${averagePrice.toFixed(2)} × ${(starPercentage / 100).toFixed(4)} = ${sellPoint.toFixed(2)}`
  }

  const getTitle = () => {
    switch (state) {
      case "firstHalf":
        return "전반전"
      case "secondHalf":
        return "후반전"
      case "quarterStopLoss":
        return "쿼터 손절모드"
      default:
        return ""
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">무한 매수법 가이드</h3>
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
                  <p className="font-semibold mb-1">T값 계산 과정</p>
                  <code className="block bg-gray-800 p-1 mb-1 rounded text-orange-300">누적 매수액 / 1회 매수 시도액</code>
                  <p className="mb-1">{formatAmount(round.totalBuyAmount)} / {formatAmount(tryAmount)} = {round.totalBuyAmount / tryAmount}</p>
                  <p className="text-gray-400">(소수점 셋째 자리에서 반올림)</p>
                </div>
              </div>
            </div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {tValue.toFixed(2)} 회
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
              Star 퍼센트
              <div className="group relative cursor-help">
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute right-0 w-48 p-2 mt-1 text-xs text-white bg-gray-900 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg border border-gray-700">
                  <p className="font-semibold mb-1">Star값 계산 과정</p>
                  <code className="block bg-gray-800 p-1 rounded text-blue-300">(10 - T/2)%</code>
                  <p className="mt-1">10 - ({tValue}/2) = {starPercentage.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {starPercentage.toFixed(2)} %
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* 매수 가이드 */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-lg">
          <h4 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
            매수 가이드
          </h4>

          {(state === "firstHalf" || state === "secondHalf") && (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-200 shadow-sm">
                <div className="text-xs text-red-600 mb-1 font-bold flex items-center justify-between">
                  <span>LOC 매수 포인트</span>
                  <span className="text-gray-400 text-xs">매도 포인트 - $0.01</span>
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(buyPoint)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  평단가 ${averagePrice.toFixed(2)} + 별{starPercentage.toFixed(2)}% = ${sellPoint.toFixed(2)} - $0.01
                </div>
              </div>

              {state === "firstHalf" && (
                <>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1 font-semibold">LOC 평단 매수 (시도액 절반)</div>
                    <div className="text-lg font-bold">
                      {formatPrice(averagePrice)} <span className="text-sm font-medium text-red-600">× {locAverageQuantity}개</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      절반 금액({formatAmount(tryAmount / 2)}) / 평단가({averagePrice.toFixed(2)}) = {locAverageQuantity}개
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1 font-semibold">LOC {starPercentage.toFixed(2)}% 매수 (시도액 절반)</div>
                    <div className="text-lg font-bold">
                      {formatPrice(buyPoint)} <span className="text-sm font-medium text-red-600">× {locStarQuantity}개</span>
                    </div>
                  </div>
                </>
              )}

              {state === "secondHalf" && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-semibold">LOC {starPercentage.toFixed(2)}% 매수 (시도액 전체)</div>
                  <div className="text-lg font-bold">
                    {formatPrice(buyPoint)} <span className="text-sm font-medium text-red-600">× {locAverageQuantity + locStarQuantity}개</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    각 조건별 {locAverageQuantity}개 매수 (총 {locAverageQuantity + locStarQuantity}개)
                  </div>
                </div>
              )}
            </div>
          )}

          {state === "quarterStopLoss" && (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-200 shadow-sm">
                  <div className="text-xs text-red-600 mb-1 font-bold">LOC +4.73% 매도 (추가 상승 매도)</div>
                  <div className="text-lg font-bold">
                    {formatPrice(sellPoint)} <span className="text-sm font-normal text-gray-500 ml-1">걸기</span>
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* 매도 가이드 */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg">
          <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
            매도 가이드
          </h4>

          {(state === "firstHalf" || state === "secondHalf") && (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 shadow-sm">
                <div className="text-xs text-blue-600 mb-1 font-bold">LOC 매도 포인트</div>
                <div className="text-lg font-bold">
                  {formatPrice(sellPoint)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getPointCalculation()}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="text-xs text-blue-500 mb-1 font-semibold flex items-center justify-between">
                  <span>LOC {starPercentage.toFixed(2)}%</span>
                  <span className="text-gray-400 text-xs">전체 수량의 25%</span>
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(sellPoint)} <span className="text-sm font-medium text-blue-600">× {quarterSellShares}주</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="text-xs text-blue-500 mb-1 font-semibold flex items-center justify-between">
                  <span>AFTER 지정가 +10%</span>
                  <span className="text-gray-400 text-xs">나머지 75%</span>
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(applyPercentage(averagePrice, 10))} <span className="text-sm font-medium text-blue-600">× {remainingSellShares}주</span>
                </div>
              </div>
            </div>
          )}

          {state === "quarterStopLoss" && (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-200 shadow-sm">
                <div className="text-xs text-red-600 mb-1 font-bold">1/4 시장가(MOC) 즉시 손절</div>
                <div className="text-sm">현재 보유량의 25%인 <span className="font-bold text-red-700">{quarterSellShares}주</span>를 시장가 매도하여 현금 확보</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm mt-3">
                <div className="text-xs text-blue-500 mb-1 font-semibold flex items-center justify-between">
                  <span>LOC 매도 포인트</span>
                  <span className="text-gray-400 text-xs">남은 수량의 25%</span>
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(sellPoint)} <span className="text-sm font-medium text-blue-600">× {Math.floor(remainingSellShares / 4)}주</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="text-xs text-blue-500 mb-1 font-semibold flex items-center justify-between">
                  <span>지정가 +10% 매도</span>
                  <span className="text-gray-400 text-xs">나머지 전체</span>
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(applyPercentage(averagePrice, 10))} <span className="text-sm font-medium text-blue-600">× {remainingSellShares - Math.floor(remainingSellShares / 4)}주</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
