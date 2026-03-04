import { Database, Round } from "@/types"
import { updateRoundCalculations } from "@/lib/calculations/rounds"

const DATA_FILE = "/data/database.json"

/**
 * 초기 데이터베이스 생성
 */
function createInitialDatabase(): Database {
  return {
    rounds: [],
    symbols: ["TQQQ", "SOXL"],
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * 데이터베이스 불러오기
 */
export async function loadDatabase(): Promise<Database> {
  try {
    // 브라우저 환경인지 확인
    if (typeof window === "undefined") {
      return createInitialDatabase()
    }

    // localStorage에서 데이터 불러오기
    const stored = localStorage.getItem("infinite_buying_db")
    if (!stored) {
      return createInitialDatabase()
    }

    const db: Database = JSON.parse(stored)
    return db
  } catch (error) {
    console.error("Failed to load database:", error)
    return createInitialDatabase()
  }
}

/**
 * 데이터베이스 저장하기
 */
export async function saveDatabase(db: Database): Promise<void> {
  try {
    // 브라우저 환경인지 확인
    if (typeof window === "undefined") {
      return
    }

    db.lastUpdated = new Date().toISOString()
    localStorage.setItem("infinite_buying_db", JSON.stringify(db))
  } catch (error) {
    console.error("Failed to save database:", error)
    throw new Error("데이터 저장에 실패했습니다")
  }
}

/**
 * 기존 데이터를 새로운 형식으로 마이그레이션
 */
function migrateRound(round: any): Round {
  // 이미 새로운 형식이면 그대로 반환
  if (round.sells !== undefined && round.remainingQuantity !== undefined) {
    return round
  }

  // 기존 형식을 새로운 형식으로 변환
  return {
    ...round,
    sells: round.sell ? [round.sell] : [],
    totalBuyQuantity: round.totalQuantity ?? 0,
    totalSellQuantity: round.sell?.quantity ?? 0,
    remainingQuantity: round.totalQuantity ?? (round.sell?.quantity ?? 0),
    totalSellAmount: round.sell?.amount ?? 0,
    netSellAmount: 0,
    realizedProfitAmount: undefined,
    realizedProfitRate: undefined,
    unrealizedProfitAmount: undefined,
    unrealizedProfitRate: undefined,
  }
}

/**
 * 모든 회차 불러오기 (마이그레이션 포함)
 */
export async function loadRounds(): Promise<Round[]> {
  const db = await loadDatabase()
  const migratedRounds = db.rounds.map(migrateRound)

  // 마이그레이션이 필요했으면 저장
  const needsMigration = db.rounds.some((r: any) => r.sells === undefined || r.remainingQuantity === undefined)
  if (needsMigration) {
    db.rounds = migratedRounds
    await saveDatabase(db)
  }

  return migratedRounds.map((round) => updateRoundCalculations(round))
}

/**
 * 회차 저장하기
 */
export async function saveRquares(rounds: Round[]): Promise<void> {
  const db = await loadDatabase()
  db.rounds = rounds
  await saveDatabase(db)
}

/**
 * 회차 추가
 */
export async function addRound(round: Round): Promise<void> {
  const db = await loadDatabase()
  const updatedRound = updateRoundCalculations(round)
  db.rounds.push(updatedRound)
  await saveDatabase(db)
}

/**
 * 회차 업데이트
 */
export async function updateRound(roundId: string, updates: Partial<Round>): Promise<void> {
  const db = await loadDatabase()
  const index = db.rounds.findIndex((r) => r.id === roundId)

  if (index === -1) {
    throw new Error("회차를 찾을 수 없습니다")
  }

  db.rounds[index] = {
    ...db.rounds[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  db.rounds[index] = updateRoundCalculations(db.rounds[index])
  await saveDatabase(db)
}

/**
 * 회차 삭제
 */
export async function deleteRound(roundId: string): Promise<void> {
  const db = await loadDatabase()
  db.rounds = db.rounds.filter((r) => r.id !== roundId)
  await saveDatabase(db)
}

/**
 * 다음 회차 번호 계산
 */
export async function getNextRoundNumber(): Promise<number> {
  const rounds = await loadRounds()
  if (rounds.length === 0) return 1
  return Math.max(...rounds.map((r) => r.roundNumber)) + 1
}

/**
 * 종목 목록 불러오기
 */
export async function loadSymbols(): Promise<string[]> {
  const db = await loadDatabase()
  return db.symbols
}

/**
 * CSV로 내보내기
 */
export function exportToCSV(rounds: Round[]): string {
  const headers = [
    "회차",
    "종목",
    "상태",
    "매수일",
    "매도일",
    "평균매수가",
    "매도가",
    "수량",
    "총매수액",
    "수익률(%)",
    "수익금",
  ]

  const rows = rounds.map((round) => [
    round.roundNumber,
    round.symbol,
    round.status === "active" ? "진행중" : "완료",
    round.buys[0]?.date || "",
    round.sell?.date || "",
    round.averageBuyPrice.toFixed(2),
    round.sell?.price.toFixed(2) || "",
    round.totalQuantity,
    round.totalBuyAmount.toFixed(2),
    round.profitRate?.toFixed(2) || "",
    round.profitAmount?.toFixed(2) || "",
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  return csvContent
}

/**
 * CSV 다운로드
 */
export function downloadCSV(rounds: Round[], filename: string = "rounds.csv"): void {
  const csv = exportToCSV(rounds)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
