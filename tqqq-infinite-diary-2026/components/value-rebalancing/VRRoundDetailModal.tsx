"use client"

import { useState } from "react"
import { VRRound } from "@/types"
import { addVRTransactionRecord, deleteVRTransaction } from "@/lib/data/vr-round-manager"

interface VRRoundDetailModalProps {
  round: VRRound
  onClose: () => void
  onRefresh?: () => void
  onUpdate?: (updatedRound: VRRound) => void
}

export function VRRoundDetailModal({ round, onClose, onRefresh, onUpdate }: VRRoundDetailModalProps) {
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [currentRound, setCurrentRound] = useState<VRRound>(round)
  const [transactionType, setTransactionType] = useState<"BUY" | "SELL">("BUY")
  const [transactionShares, setTransactionShares] = useState("")
  const [transactionPrice, setTransactionPrice] = useState("")
  const [transactionNotes, setTransactionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionError, setTransactionError] = useState("")

  const {
    roundId,
    startDate,
    endDate,
    initialShares,
    initialPool,
    finalShares,
    finalPool,
    sharesChange,
    poolChange,
    transactions,
    isActive,
  } = currentRound

  // 종가를 50으로 가정 (실제로는 전달받아야 함)
  const currentPrice = 50
  const initialValue = initialShares * currentPrice + initialPool
  const finalValue = finalShares * currentPrice + finalPool
  const profit = finalValue - initialValue
  const profitRate = initialValue > 0 ? (profit / initialValue) * 100 : 0

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setTransactionError("")
    setIsSubmitting(true)

    try {
      const shares = parseInt(transactionShares)
      const price = parseFloat(transactionPrice)

      if (isNaN(shares) || shares <= 0) {
        throw new Error("유효한 수량을 입력해주세요.")
      }
      if (isNaN(price) || price <= 0) {
        throw new Error("유효한 가격을 입력해주세요.")
      }

      // 거래 추가
      await addVRTransactionRecord(
        roundId,
        transactionType,
        shares,
        price,
        transactionNotes
      )

      // 폼 초기화 및 닫기
      setShowTransactionForm(false)
      setTransactionShares("")
      setTransactionPrice("")
      setTransactionNotes("")
      setTransactionType("BUY")

      // 데이터 새로고침
      if (onRefresh) {
        onRefresh()
      }

      // 현재 모달 닫기 (업데이트된 데이터로 다시 열리게)
      onClose()
    } catch (err) {
      setTransactionError(err instanceof Error ? err.message : "거래 추가에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 거래 후 미리보기 계산
  const previewShares = parseInt(transactionShares) || 0
  const previewPrice = parseFloat(transactionPrice) || 0
  const previewTotalAmount = previewShares * previewPrice

  const previewSharesAfter = transactionType === "BUY"
    ? finalShares + previewShares
    : finalShares - previewShares

  const previewPoolAfter = transactionType === "BUY"
    ? finalPool - previewTotalAmount
    : finalPool + previewTotalAmount

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm("정말 이 거래 내역을 삭제하시겠습니까?")) {
      return
    }

    try {
      await deleteVRTransaction(transactionId)

      // 데이터 새로고침
      if (onRefresh) {
        onRefresh()
      }

      // 업데이트된 차수 정보 가져오기
      const { getVRRound } = require("@/lib/data/vr-storage")
      const updatedRound = await getVRRound(roundId)

      if (updatedRound) {
        setCurrentRound(updatedRound)
        if (onUpdate) {
          onUpdate(updatedRound)
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "거래 삭제에 실패했습니다.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {roundId} 상세 정보
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {startDate} ~ {endDate}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isActive ? (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
                  진행중
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-sm font-semibold">
                  완료
                </span>
              )}
              <button
                onClick={() => setShowTransactionForm(!showTransactionForm)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {showTransactionForm ? "취소" : "거래 추가"}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 수익률 요약 */}
          <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              차수 성과
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">초기 자산</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${initialValue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">최종 자산</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${finalValue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">수익/손실</p>
                <p
                  className={`text-xl font-bold ${
                    profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">수익률</p>
                <p
                  className={`text-xl font-bold ${
                    profitRate >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {profitRate >= 0 ? "+" : ""}{profitRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* 수량 및 현금 변화 */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">주식수 변화</h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">초기</span>
                <span className="font-semibold">{initialShares}주</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600 dark:text-gray-400">최종</span>
                <span className="font-semibold">{finalShares}주</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className={`font-bold ${sharesChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {sharesChange >= 0 ? "+" : ""}{sharesChange}주
                </span>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">현금(Pool) 변화</h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">초기</span>
                <span className="font-semibold">${initialPool.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600 dark:text-gray-400">최종</span>
                <span className="font-semibold">${finalPool.toFixed(2)}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className={`font-bold ${poolChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {poolChange >= 0 ? "+" : ""}${poolChange.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 거래 추가 폼 */}
          {showTransactionForm && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                거래 추가
              </h3>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                {/* 거래 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    거래 유형
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setTransactionType("BUY")}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                        transactionType === "BUY"
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      매수
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionType("SELL")}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                        transactionType === "SELL"
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      매도
                    </button>
                  </div>
                </div>

                {/* 수량 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    수량 (주)
                  </label>
                  <input
                    type="number"
                    value={transactionShares}
                    onChange={(e) => setTransactionShares(e.target.value)}
                    placeholder="예: 10"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* 가격 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    가격 ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={transactionPrice}
                    onChange={(e) => setTransactionPrice(e.target.value)}
                    placeholder="예: 45.50"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    메모 (선택)
                  </label>
                  <input
                    type="text"
                    value={transactionNotes}
                    onChange={(e) => setTransactionNotes(e.target.value)}
                    placeholder="예: 리밸런싱"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* 미리보기 */}
                {previewShares > 0 && previewPrice > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">변화 미리보기</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">현재 주식수</p>
                        <p className="font-semibold">{finalShares}주</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">거래 후 주식수</p>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{previewSharesAfter}주</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">현재 현금</p>
                        <p className="font-semibold">${finalPool.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">거래 후 현금</p>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">${previewPoolAfter.toFixed(2)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 dark:text-gray-400">거래 금액</p>
                        <p className="font-bold text-lg">
                          {transactionType === "BUY" ? "-" : "+"}${previewTotalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 에러 메시지 */}
                {transactionError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
                    {transactionError}
                  </div>
                )}

                {/* 버튼 */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "저장 중..." : "거래 추가"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTransactionForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 거래 내역 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              거래 내역 ({transactions.length}건)
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p>거래 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">날짜</th>
                      <th className="text-center py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">유형</th>
                      <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">수량</th>
                      <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">가격</th>
                      <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">금액</th>
                      <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">변화 후</th>
                      <th className="text-left py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">메모</th>
                      <th className="text-center py-2 px-4 text-gray-600 dark:text-gray-400 font-semibold">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-4 text-gray-900 dark:text-white">{t.date}</td>
                        <td className="py-2 px-4 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              t.type === "BUY"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {t.type === "BUY" ? "매수" : "매도"}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right text-gray-900 dark:text-white">{t.shares}</td>
                        <td className="py-2 px-4 text-right text-gray-900 dark:text-white">${t.price.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right text-gray-900 dark:text-white">
                          ${t.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-2 px-4 text-right text-gray-900 dark:text-white">
                          <div className="text-xs">
                            <div>{t.sharesAfter}주</div>
                            <div className="text-gray-500">${t.poolAfter.toFixed(2)}</div>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{t.notes || "-"}</td>
                        <td className="py-2 px-4 text-center">
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
