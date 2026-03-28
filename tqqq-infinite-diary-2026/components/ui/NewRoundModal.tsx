"use client"

import { useState } from "react"
import { Symbol } from "@/types"

interface NewRoundModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (symbol: Symbol, firstBuyPrice: number, firstBuyQuantity: number, totalSeedAmount?: number, tryAmount?: number, version?: string) => Promise<void>
}

export function NewRoundModal({ isOpen, onClose, onSubmit }: NewRoundModalProps) {
  const [symbol, setSymbol] = useState<Symbol>("TQQQ")
  const [version, setVersion] = useState<string>("2.2")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [seedAmount, setSeedAmount] = useState("")
  const [divisionCount, setDivisionCount] = useState("40")
  const [tryAmount, setTryAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSeedAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSeedAmount(val)
    if (val && divisionCount) {
      const seed = Number.parseFloat(val)
      const div = Number.parseFloat(divisionCount)
      if (seed > 0 && div > 0) {
        // 소수점 2자리까지만 표시하고 필요 없는 0은 제거
        setTryAmount(Number((seed / div).toFixed(2)).toString())
      }
    }
  }

  const handleDivisionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDivisionCount(val)
    if (seedAmount && val) {
      const seed = Number.parseFloat(seedAmount)
      const div = Number.parseFloat(val)
      if (seed > 0 && div > 0) {
        setTryAmount(Number((seed / div).toFixed(2)).toString())
      }
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const priceNum = Number.parseFloat(price)
    const quantityNum = Number.parseFloat(quantity)

    if (Number.isNaN(priceNum) || priceNum <= 0) {
      alert("유효한 가격을 입력해주세요")
      return
    }

    if (Number.isNaN(quantityNum) || quantityNum <= 0) {
      alert("유효한 수량을 입력해주세요")
      return
    }

    const seedNum = seedAmount ? Number.parseFloat(seedAmount) : undefined
    const tryNum = tryAmount ? Number.parseFloat(tryAmount) : undefined

    try {
      setLoading(true)
      await onSubmit(symbol, priceNum, quantityNum, seedNum, tryNum, version)
      handleClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : "회차 생성에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSymbol("TQQQ")
    setVersion("2.2")
    setPrice("")
    setQuantity("")
    setQuantity("")
    setSeedAmount("")
    setDivisionCount("40")
    setTryAmount("")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            새 회차 시작
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 종목 선택 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                종목
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value as Symbol)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TQQQ">TQQQ</option>
                <option value="SOXL">SOXL</option>
              </select>
            </div>

            {/* 버전 선택 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                무한매수 버젼
              </label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm text-gray-900 dark:text-white font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="version"
                    value="2.2"
                    checked={version === "2.2"}
                    onChange={(e) => setVersion(e.target.value)}
                    className="mr-2 h-4 w-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 rounded-full"
                  />
                  버전 2.2
                </label>
                <label className="flex items-center text-sm text-gray-900 dark:text-white font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="version"
                    value="4.0"
                    checked={version === "4.0"}
                    onChange={(e) => setVersion(e.target.value)}
                    className="mr-2 h-4 w-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 rounded-full"
                  />
                  버전 4.0
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* 총 투자 원금 */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">
                  총 원금(선택)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={seedAmount}
                  onChange={handleSeedAmountChange}
                  placeholder="예: 40000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 분할 차수 (새로 추가) */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">
                  분할 차수
                </label>
                <input
                  type="number"
                  min="1"
                  value={divisionCount}
                  onChange={handleDivisionCountChange}
                  placeholder="예: 40"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 1회 매수 시도액 */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">
                  1회 시도액(선택)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tryAmount}
                  onChange={(e) => setTryAmount(e.target.value)}
                  placeholder="예: 1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 매수 가격 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                첫 매수 가격 ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="예: 35.50"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 매수 수량 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                매수 수량
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="예: 10"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 예상 금액 표시 */}
            {price && quantity && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                <div className="text-sm text-black dark:text-white">
                  예상 매수 금액:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(Number.parseFloat(price) * Number.parseFloat(quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* 버튼 그룹 */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "생성 중..." : "회차 시작"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
