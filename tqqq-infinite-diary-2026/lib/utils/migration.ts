import { Database, Round, Trade } from "@/types"
import { migrateUtcToKoreanDate } from "@/lib/utils/timezone"

/**
 * 기존 UTC 기반 날짜를 한국시간 기반으로 변환하는 마이그레이션 함수
 *
 * @param db 기존 데이터베이스
 * @returns 마이그레이션된 데이터베이스
 */
export function migrateDatabaseToKoreanTime(db: Database): Database {
  const migratedRounds = db.rounds.map(round => migrateRoundToKoreanTime(round))

  return {
    ...db,
    rounds: migratedRounds,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * 회차의 날짜를 한국시간 기반으로 변환
 *
 * @param round 기존 회차
 * @returns 마이그레이션된 회차
 */
function migrateRoundToKoreanTime(round: Round): Round {
  const migratedBuys = round.buys.map(trade => migrateTradeToKoreanTime(trade))
  const migratedSells = round.sells.map(trade => migrateTradeToKoreanTime(trade))

  return {
    ...round,
    buys: migratedBuys,
    sells: migratedSells
  }
}

/**
 * 거래의 날짜를 한국시간 기반으로 변환
 *
 * @param trade 기존 거래
 * @returns 마이그레이션된 거래
 */
function migrateTradeToKoreanTime(trade: Trade): Trade {
  return {
    ...trade,
    date: migrateUtcToKoreanDate(trade.date)
  }
}

/**
 * 마이그레이션 실행 함수
 * localStorage에서 데이터를 읽어 마이그레이션 후 저장
 *
 * @returns 마이그레이션 성공 여부
 */
export async function runMigration(): Promise<boolean> {
  try {
    // 브라우저 환경 체크
    if (typeof window === "undefined") {
      console.log("서버 환경에서는 마이그레이션을 건너뜁니다")
      return false
    }

    // 기존 데이터 로드
    const stored = localStorage.getItem("infinite_buying_db")
    if (!stored) {
      console.log("마이그레이션할 데이터가 없습니다")
      return false
    }

    const db: Database = JSON.parse(stored)

    // 이미 마이그레이션된 데이터인지 확인
    const migrationFlag = localStorage.getItem("korean_timezone_migration_v1")
    if (migrationFlag === "completed") {
      console.log("이미 마이그레이션이 완료되었습니다")
      return false
    }

    console.log("🔄 한국시간 기반 데이터 마이그레이션 시작...")

    // 마이그레이션 실행
    const migratedDb = migrateDatabaseToKoreanTime(db)

    // 마이그레이션된 데이터 저장
    localStorage.setItem("infinite_buying_db", JSON.stringify(migratedDb))

    // 마이그레이션 완료 플래그 저장
    localStorage.setItem("korean_timezone_migration_v1", "completed")

    console.log("✅ 마이그레이션 완료!")

    // 마이그레이션 전후 비교 로그
    logMigrationComparison(db, migratedDb)

    return true
  } catch (error) {
    console.error("❌ 마이그레이션 실패:", error)
    return false
  }
}

/**
 * 마이그레이션 전후 비교 로그
 */
function logMigrationComparison(before: Database, after: Database) {
  console.log("📊 마이그레이션 비교:")
  console.log(`- 회차 수: ${before.rounds.length} → ${after.rounds.length}`)

  before.rounds.forEach((round, index) => {
    const afterRound = after.rounds[index]

    console.log(`\n회차 #${round.roundNumber} (${round.symbol}):`)

    round.buys.forEach((buy, buyIndex) => {
      const afterBuy = afterRound.buys[buyIndex]
      console.log(`  매수 #${buyIndex + 1}: ${buy.date} → ${afterBuy.date}`)
    })

    round.sells.forEach((sell, sellIndex) => {
      const afterSell = afterRound.sells[sellIndex]
      console.log(`  매도 #${sellIndex + 1}: ${sell.date} → ${afterSell.date}`)
    })
  })
}

/**
 * 마이그레이션 초기화 (테스트용)
 * 마이그레이션 플래그를 삭제하여 재마이그레이션 가능
 */
export function resetMigration(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("korean_timezone_migration_v1")
    console.log("마이그레이션 플래그가 초기화되었습니다")
  }
}
