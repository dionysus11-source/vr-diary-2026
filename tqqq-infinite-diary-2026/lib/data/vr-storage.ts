import { VRDatabase, VRRecord, VRInitialPortfolio, VRRound, VRTransaction, VRBackupData } from "@/types"
import { ValueRebalancingCalculator } from "@/lib/calculations/vr-calculator"

const STORAGE_KEY = "value_rebalancing_db"

/**
 * 초기 데이터베이스 생성
 */
function createInitialDatabase(): VRDatabase {
  return {
    initialPortfolio: null,
    records: [],
    rounds: [],
    transactions: [],
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * 데이터베이스 불러오기
 */
export async function loadVRDatabase(): Promise<VRDatabase> {
  try {
    if (typeof window === "undefined") {
      return createInitialDatabase()
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return createInitialDatabase()
    }

    const db: VRDatabase = JSON.parse(stored)
    return db
  } catch (error) {
    console.error("Failed to load VR database:", error)
    return createInitialDatabase()
  }
}

/**
 * 데이터베이스 저장하기
 */
export async function saveVRDatabase(db: VRDatabase): Promise<void> {
  try {
    if (typeof window === "undefined") {
      return
    }

    db.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (error) {
    console.error("Failed to save VR database:", error)
    throw new Error("데이터 저장에 실패했습니다")
  }
}

/**
 * 초기 포트폴리오 설정
 */
export async function setInitialPortfolio(
  initialDate: string,
  initialCash: number,
  initialShares: number,
  averagePrice: number
): Promise<void> {
  const db = await loadVRDatabase()

  const totalInvested = ValueRebalancingCalculator.calculateTotalInvested(
    initialCash,
    initialShares,
    averagePrice
  )

  db.initialPortfolio = {
    initialDate,
    initialCash,
    initialShares,
    averagePrice,
    totalInvested,
  }

  await saveVRDatabase(db)
}

/**
 * 초기 포트폴리오 조회
 */
export async function getInitialPortfolio(): Promise<VRInitialPortfolio | null> {
  const db = await loadVRDatabase()
  return db.initialPortfolio
}

/**
 * 리밸런싱 기록 추가
 */
export async function addVRRecord(record: VRRecord): Promise<void> {
  const db = await loadVRDatabase()
  db.records.push(record)
  await saveVRDatabase(db)
}

/**
 * 모든 리밸런싱 기록 조회 (최신순)
 */
export async function loadVRRecords(): Promise<VRRecord[]> {
  const db = await loadVRDatabase()
  const records = [...db.records].sort((a, b) => b.date.localeCompare(a.date))
  return records
}

/**
 * 최신 리밸런싱 기록 조회
 */
export async function getLatestVRRecord(): Promise<VRRecord | null> {
  const records = await loadVRRecords()
  return records.length > 0 ? records[0] : null
}

/**
 * 차수 추가
 */
export async function addVRRound(round: VRRound): Promise<void> {
  const db = await loadVRDatabase()

  // 기존 같은 roundId가 있으면 업데이트
  const existingIndex = db.rounds.findIndex((r) => r.roundId === round.roundId)
  if (existingIndex >= 0) {
    db.rounds[existingIndex] = round
  } else {
    db.rounds.push(round)
  }

  await saveVRDatabase(db)
}

/**
 * 모든 차수 조회
 */
export async function loadVRRounds(): Promise<VRRound[]> {
  const db = await loadVRDatabase()
  return db.rounds
}

/**
 * 특정 차수 조회
 */
export async function getVRRound(roundId: string): Promise<VRRound | null> {
  const rounds = await loadVRRounds()
  return rounds.find((r) => r.roundId === roundId) || null
}

/**
 * 거래 기록 추가
 */
export async function addVRTransaction(transaction: VRTransaction): Promise<void> {
  const db = await loadVRDatabase()
  db.transactions.push(transaction)
  await saveVRDatabase(db)
}

/**
 * 차수별 거래 기록 조회
 */
export async function getVRTransactionsByRound(roundId: string): Promise<VRTransaction[]> {
  const db = await loadVRDatabase()
  return db.transactions.filter((t) => t.roundId === roundId)
}

/**
 * 데이터 초기화
 */
export async function clearVRData(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(STORAGE_KEY)
}

/**
 * JSON 백업 파일 생성 및 다운로드
 */
export function downloadVRJSONBackup(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    loadVRDatabase().then((db) => {
      const backupData: VRBackupData = {
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
        link.setAttribute("download", `value-rebalancing-backup-${timestamp}.json`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    })
  } catch (error) {
    console.error("Failed to create VR backup:", error)
    throw new Error("백업 파일 생성에 실패했습니다")
  }
}

/**
 * JSON 백업 파일에서 복원
 */
export async function restoreVRFromJSONBackup(file: File): Promise<void> {
  try {
    const text = await file.text()
    const backupData = JSON.parse(text) as VRBackupData

    // 백업 파일 형식 검증
    if (!backupData.version || !backupData.data) {
      throw new Error("잘못된 백업 파일 형식입니다")
    }

    // 데이터베이스 구조 검증
    const db = backupData.data
    if (!db.records || !Array.isArray(db.records)) {
      throw new Error("백업 파일 데이터가 올바르지 않습니다")
    }

    // localStorage에 저장
    db.lastUpdated = new Date().toISOString()
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    }
  } catch (error) {
    console.error("Failed to restore VR backup:", error)
    throw new Error("백업 복원에 실패했습니다")
  }
}

/**
 * CSV export (CLI 프로그램과 호환)
 */
export function exportVRToCSV(records: VRRecord[]): string {
  const headers = [
    "date",
    "price",
    "shares",
    "pool",
    "e_value",
    "v_value",
    "signal",
    "benchmark_shares",
    "benchmark_value",
    "created_at",
  ]

  const rows = records.map((record) => [
    record.date,
    record.price.toFixed(2),
    record.shares,
    record.pool.toFixed(2),
    record.eValue.toFixed(2),
    record.vValue.toFixed(2),
    record.signal,
    record.benchmarkShares.toFixed(2),
    record.benchmarkValue.toFixed(2),
    record.createdAt,
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
export function downloadVRCSV(records: VRRecord[], filename: string = "vr-records.csv"): void {
  const csv = exportVRToCSV(records)
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
