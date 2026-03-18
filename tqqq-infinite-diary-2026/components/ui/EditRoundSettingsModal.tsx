"use client"

import { useState } from "react"
import { Round } from "@/types"
import { Button } from "./Button"

interface EditRoundSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (totalSeedAmount?: number, tryAmount?: number) => Promise<void>
  round: Round
}

export function EditRoundSettingsModal({ isOpen, onClose, onSubmit, round }: EditRoundSettingsModalProps) {
  const [seedAmount, setSeedAmount] = useState(round.totalSeedAmount?.toString() || "")
  const [tryAmount, setTryAmount] = useState(round.tryAmount?.toString() || "")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const seedNum = seedAmount ? Number.parseFloat(seedAmount) : undefined
    const tryNum = tryAmount ? Number.parseFloat(tryAmount) : undefined

    if (seedNum !== undefined && (Number.isNaN(seedNum) || seedNum <= 0)) {
      alert("유효한 총 투자 원금(Seed)을 입력해주세요")
      return
    }

    if (tryNum !== undefined && (Number.isNaN(tryNum) || tryNum <= 0)) {
      alert("유효한 1회 시도액을 입력해주세요")
      return
    }

    try {
      setLoading(true)
      await onSubmit(seedNum, tryNum)
      onClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : "회차 설정 저장에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            회차 기준 금액 설정
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 총 투자 원금 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                총 투자 원금 (Seed) - 선택
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={seedAmount}
                onChange={(e) => setSeedAmount(e.target.value)}
                placeholder="예: 40000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">입력하지 않으면 가이드에서 제외됩니다.</p>
            </div>

            {/* 1회 매수 시도액 */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                1회 시도액 - 선택
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
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                입력하지 않을 시 첫 매수 금액({round.buys[0] && round.buys[0].amount.toFixed(2)})을 1회 시도액으로 간주하여 V2.2 가이드 T값을 계산합니다.
              </p>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={onClose}
                disabled={loading}
                variant="secondary"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                className="flex-1"
              >
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
