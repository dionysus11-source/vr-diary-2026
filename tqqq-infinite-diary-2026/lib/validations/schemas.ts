import { z } from "zod"

// 거래 스키마
export const tradeSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["buy", "sell"]),
  symbol: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD이어야 합니다"),
  price: z.number().positive("가격은 0보다 커야 합니다"),
  quantity: z.number().positive("수량은 0보다 커야 합니다"),
  amount: z.number().nonnegative(),
})

// 회차 스키마
export const roundSchema = z.object({
  id: z.string().uuid(),
  roundNumber: z.number().int().positive(),
  symbol: z.string().min(1),
  status: z.enum(["active", "completed"]),
  buys: z.array(tradeSchema).min(1, "최소 하나의 매수 기록이 있어야 합니다"),
  sell: tradeSchema.optional(),
  averageBuyPrice: z.number().nonnegative(),
  totalQuantity: z.number().positive(),
  totalBuyAmount: z.number().positive(),
  currentPrice: z.number().positive().optional(),
  profitRate: z.number().optional(),
  profitAmount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// 거래 입력 스키마 (사용자 입력용)
export const tradeInputSchema = z.object({
  symbol: z.enum(["TQQQ", "SOXL"], {
    errorMap: () => ({ message: "종목을 선택해주세요" }),
  }),
  type: z.enum(["buy", "sell"], {
    errorMap: () => ({ message: "거래 유형을 선택해주세요" }),
  }),
  price: z.string().transform((val) => {
    const num = parseFloat(val.replace(/,/g, ""))
    if (isNaN(num) || num <= 0) {
      throw new Error("올바른 가격을 입력해주세요")
    }
    return num
  }),
  quantity: z.string().transform((val) => {
    const num = parseFloat(val.replace(/,/g, ""))
    if (isNaN(num) || num <= 0) {
      throw new Error("올바른 수량을 입력해주세요")
    }
    return num
  }),
  date: z.string().optional().default(() => new Date().toISOString().split("T")[0]),
})

export type TradeInput = z.infer<typeof tradeInputSchema>

// 현재 가격 입력 스키마
export const currentPriceInputSchema = z.object({
  roundId: z.string().uuid(),
  price: z.string().transform((val) => {
    const num = parseFloat(val.replace(/,/g, ""))
    if (isNaN(num) || num <= 0) {
      throw new Error("올바른 가격을 입력해주세요")
    }
    return num
  }),
  date: z.string().optional().default(() => new Date().toISOString().split("T")[0]),
})

export type CurrentPriceInput = z.infer<typeof currentPriceInputSchema>

// 완료 처리 스키마
export const completeRoundSchema = z.object({
  roundId: z.string().uuid(),
  sellPrice: z.string().transform((val) => {
    const num = parseFloat(val.replace(/,/g, ""))
    if (isNaN(num) || num <= 0) {
      throw new Error("올바른 매도 가격을 입력해주세요")
    }
    return num
  }),
  sellDate: z.string().optional().default(() => new Date().toISOString().split("T")[0]),
})

export type CompleteRoundInput = z.infer<typeof completeRoundSchema>
