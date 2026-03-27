"use client"

import { useState } from "react"
import { VRRecommendationCalculator } from "@/lib/calculations/vr-recommendation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

interface VRRecommendationModalProps {
  vValue: number
  shares: number
  pool: number
  onClose: () => void
}

export function VRRecommendationModal({
  vValue,
  shares,
  pool,
  onClose,
}: VRRecommendationModalProps) {
  const [sharesPerOrder, setSharesPerOrder] = useState<number>(5)
  const [poolLimitPercent, setPoolLimitPercent] = useState<number>(80)

  const recommendation = VRRecommendationCalculator.calculateRecommendation(
    vValue,
    shares,
    pool,
    sharesPerOrder,
    poolLimitPercent
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              매수/매도 추천
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    주문 단위수 (주)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={sharesPerOrder}
                    onChange={(e) => setSharesPerOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    1회 주문당 매수/매도할 주식수
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pool 한도 (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={poolLimitPercent}
                    onChange={(e) => setPoolLimitPercent(parseInt(e.target.value) || 80)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    BUY 시 Pool의 최대 사용 가능 비율
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 입력 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>입력 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">V값</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${recommendation.inputSummary.vValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">매수 밴드 (V-15%)</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${recommendation.inputSummary.vValueMin.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">매도 밴드 (V+15%)</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    ${recommendation.inputSummary.vValueMax.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">주식수</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {recommendation.inputSummary.shares}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Pool</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${recommendation.inputSummary.pool.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Pool 한도 ({poolLimitPercent}%)</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${recommendation.inputSummary.poolLimit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">1회 주문수</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {recommendation.inputSummary.sharesPerOrder}주
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BUY 시나리오 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">
                BUY 시나리오 (매수 밴드: ${recommendation.buyScenario.vValue.toFixed(2)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">총 주문수</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {recommendation.buyScenario.totalOrders}회
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">총 매수 주식</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {recommendation.buyScenario.totalSharesToBuy}주
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">총 사용 금액</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${recommendation.buyScenario.totalUsed.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">최종 주식수</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {recommendation.buyScenario.finalShares}주
                  </p>
                </div>
              </div>

              {recommendation.buyScenario.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">순서</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">1주당 가격</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">주식수</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">총 금액</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">Pool 잔액</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">주식수 합계</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recommendation.buyScenario.orders.map((order) => (
                        <tr key={order.orderNum} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 text-gray-900 dark:text-white">{order.orderNum}</td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                            ${order.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{order.shares}</td>
                          <td className="px-4 py-2 text-right text-green-600 dark:text-green-400 font-semibold">
                            ${order.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                            ${order.poolAfter.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
                            {order.sharesAfter}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Pool이 부족하여 매수할 수 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SELL 시나리오 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                SELL 시나리오 (매도 밴드: ${recommendation.sellScenario.vValue.toFixed(2)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">총 주문수</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {recommendation.sellScenario.totalOrders}회
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">총 매도 주식</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {recommendation.sellScenario.totalSharesToSell}주
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({(recommendation.sellScenario.sellRatio * 100).toFixed(0)}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">총 회수 금액</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${(recommendation.sellScenario.finalPool - pool).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">최종 Pool</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${recommendation.sellScenario.finalPool.toFixed(2)}
                  </p>
                </div>
              </div>

              {recommendation.sellScenario.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">순서</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">1주당 가격</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">주식수</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">총 금액</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">Pool 합계</th>
                        <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">주식수 잔액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recommendation.sellScenario.orders.map((order) => (
                        <tr key={order.orderNum} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 text-gray-900 dark:text-white">{order.orderNum}</td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                            ${order.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{order.shares}</td>
                          <td className="px-4 py-2 text-right text-red-600 dark:text-red-400 font-semibold">
                            ${order.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
                            ${order.poolAfter.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                            {order.sharesAfter}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>매도할 주식이 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
