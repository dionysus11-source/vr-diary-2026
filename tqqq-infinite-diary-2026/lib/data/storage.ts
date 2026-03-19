import { Database, Round } from "@/types"
import { updateRoundCalculations } from "@/lib/calculations/rounds"
import { getKoreanDate } from "@/lib/utils/timezone"
import { getOrCreateDeviceId } from "@/lib/utils/auth"

const API_BASE = "/api/infinite-buying"

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
 * 데이터베이스 불러오기 (서버 연동)
 */
export async function loadDatabase(): Promise<Database> {
  try {
    if (typeof window === "undefined") {
      return createInitialDatabase()
    }
    const userId = getOrCreateDeviceId()
    const res = await fetch(`${API_BASE}?userId=${userId}`, {
      headers: { 'x-user-id': userId }
    })
    
    if (!res.ok) {
      throw new Error("서버에서 데이터를 불러오는데 실패했습니다.")
    }
    
    const rounds: Round[] = await res.json()
    return {
      rounds,
      symbols: ["TQQQ", "SOXL"],
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error("Failed to load database:", error)
    return createInitialDatabase()
  }
}

/**
 * 전역 데이터베이스 저장하기
 * (과거 호환성을 위한 래퍼이지만 가급적 개별 CRUD 함수를 사용 권장)
 */
export async function saveDatabase(db: Database): Promise<void> {
  // 전역 저장은 성능상 이슈가 있으나 호환성을 위해 유지
  // 개별 updateRound/addRound로 대체되는 추세
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
 * 회차 저장하기 (일괄 업데이트)
 */
export async function saveRquares(rounds: Round[]): Promise<void> {
  // 개별 API 업데이트로 변경
  for (const round of rounds) {
    await updateRound(round.id, round)
  }
}

/**
 * 회차 추가
 */
export async function addRound(round: Round): Promise<void> {
  if (typeof window === "undefined") return
  const userId = getOrCreateDeviceId()
  const updatedRound = updateRoundCalculations(round)
  
  await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId
    },
    body: JSON.stringify(updatedRound)
  })
}

/**
 * 회차 업데이트
 */
export async function updateRound(roundId: string, updates: Partial<Round>): Promise<void> {
  if (typeof window === "undefined") return
  const userId = getOrCreateDeviceId()
  
  // 전체 상태를 가져와서 병합 후 PUT (현재 API는 전체 교체 방식)
  const db = await loadDatabase()
  const index = db.rounds.findIndex((r) => r.id === roundId)
  if (index === -1) throw new Error("회차를 찾을 수 없습니다")
  
  let currentRound = db.rounds[index]
  currentRound = { ...currentRound, ...updates, updatedAt: new Date().toISOString() }
  currentRound = updateRoundCalculations(currentRound)
  
  await fetch(`${API_BASE}/${roundId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId
    },
    body: JSON.stringify(currentRound)
  })
}

/**
 * 회차 삭제
 */
export async function deleteRound(roundId: string): Promise<void> {
  if (typeof window === "undefined") return
  const userId = getOrCreateDeviceId()
  
  await fetch(`${API_BASE}/${roundId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId }
  })
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
    round.sells.length > 0 ? round.sells[round.sells.length - 1].date : "",
    round.averageBuyPrice.toFixed(2),
    round.sells.length > 0 ? round.sells[round.sells.length - 1].price.toFixed(2) : "",
    round.totalBuyQuantity,
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

/**
 * JSON 백업 파일 생성 및 다운로드
 */
export async function downloadJSONBackup(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }

  try {
    const db = await loadDatabase()
    if (db.rounds.length === 0) {
      throw new Error("백업할 데이터가 없습니다")
    }

    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      data: db,
    }

    const json = JSON.stringify(backupData, null, 2)
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      const timestamp = new Date().toISOString().split("T")[0]
      link.setAttribute("href", url)
      link.setAttribute("download", `tqqq-diary-backup-${timestamp}.json`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error("Failed to create backup:", error)
    throw new Error("백업 파일 생성에 실패했습니다")
  }
}

/**
 * JSON 백업 파일에서 복원
 */
export async function restoreFromJSONBackup(file: File): Promise<void> {
  try {
    const text = await file.text()
    const backupData = JSON.parse(text)

    // 백업 파일 형식 검증
    if (!backupData.version || !backupData.data) {
      throw new Error("잘못된 백업 파일 형식입니다")
    }

    const db = backupData.data as Database
    if (!db.rounds || !Array.isArray(db.rounds)) {
      throw new Error("백업 파일 데이터가 올바르지 않습니다")
    }

    // 통째로 복원하는 엔드포인트가 `/api/infinite-buying/sync` 등이 없으므로 
    // 기존 라운드를 모두 삭제 후 재등록 (임시 구현체)
    // 실제로는 Global Data Management 백업으로 유도하는 것이 좋습니다.
    const currentDb = await loadDatabase()
    for (const r of currentDb.rounds) {
      await deleteRound(r.id)
    }
    for (const r of db.rounds) {
      await addRound(r)
    }
  } catch (error) {
    console.error("Failed to restore backup:", error)
    throw new Error("백업 복원에 실패했습니다")
  }
}
