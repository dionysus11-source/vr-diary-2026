"use client"

import { useState } from "react"
import { Symbol, TradeType } from "@/types"
import { createTrade, createRound } from "@/lib/data/trades"
import { Button } from "@/components/ui/Button"
import { tradeInputSchema } from "@/lib/validations/schemas"
import { ZodError } from "zod"

interface TradeInputFormProps {
  onSubmit: (trade: any) => void
  onCancel: () => void
}

export function TradeInputForm({ onSubmit, onCancel }: TradeInputFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [symbol, setSymbol] = useState<Symbol>("TQQQ")
  const [tradeType, setTradeType] = useState<TradeType>("buy")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [error, setError] = useState<string | null>(null)

  const symbols: Symbol[] = ["TQQQ", "SOXL"]

  const handleSubmit = () => {
    setError(null)

    try {
      const validated = tradeInputSchema.parse({
        symbol,
        type: tradeType,
        price,
        quantity,
        date,
      })

      onSubmit(validated)
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0].message)
      } else {
        setError("입력값을 확인해주세요")
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (step < 5) {
        setStep((step + 1) as typeof step)
      } else {
        handleSubmit()
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full">
      <h2 className="text-xl font-bold mb-6">새 거래 입력</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Step 1: 종목 선택 */}
        {step >= 1 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              1. 종목 선택
            </label>
            <div className="flex gap-2">
              {symbols.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSymbol(s)
                    setStep(2)
                  }}
                  className={`
                    flex-1 py-3 px-4 rounded-lg font-medium transition-all
                    ${symbol === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 거래 유형 선택 */}
        {step >= 2 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              2. 거래 유형
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTradeType("buy")
                  setStep(3)
                }}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-medium transition-all
                  ${tradeType === "buy"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                  }
                `}
              >
                매수
              </button>
              <button
                onClick={() => {
                  setTradeType("sell")
                  setStep(3)
                }}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-medium transition-all
                  ${tradeType === "sell"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                  }
                `}
              >
                매도
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 가격 입력 */}
        {step >= 3 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              3. 가격 입력 ($)
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="예: 45.32"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-xs text-black dark:text-white mt-1">엔터를 누르면 다음 단계로 이동합니다</p>
          </div>
        )}

        {/* Step 4: 수량 입력 */}
        {step >= 4 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              4. 수량 입력 (주)
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="예: 100"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-xs text-black dark:text-white mt-1">엔터를 누르면 다음 단계로 이동합니다</p>
          </div>
        )}

        {/* Step 5: 날짜 입력 */}
        {step >= 5 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              5. 날짜 입력
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-xs text-black dark:text-white mt-1">엔터를 누르면 제출합니다</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          취소
        </Button>
        {step > 1 && (
          <Button
            variant="secondary"
            onClick={() => setStep((step - 1) as typeof step)}
          >
            이전
          </Button>
        )}
        {step === 5 && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="flex-1"
          >
            제출
          </Button>
        )}
      </div>
    </div>
  )
}
