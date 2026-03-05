/**
 * 한국시간 기준으로 현재 날짜를 반환합니다 (YYYY-MM-DD)
 * UTC 시간을 한국시간(KST/UTC+9)으로 변환하여 날짜를 계산합니다.
 *
 * @returns 한국시간 기준 날짜 문자열 (YYYY-MM-DD)
 */
export function getKoreanDate(): string {
  const now = new Date()
  // UTC 시간에 9시간을 더하여 한국시간으로 변환
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString().split("T")[0]
}

/**
 * UTC 날짜 문자열을 한국시간 기준 날짜로 변환합니다.
 *
 * @param utcDate UTC 기준 날짜 문자열 (YYYY-MM-DD)
 * @returns 한국시간 기준 날짜 문자열 (YYYY-MM-DD)
 */
export function utcToKoreanDate(utcDate: string): string {
  const date = new Date(utcDate + "T00:00:00Z")
  const koreanTime = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString().split("T")[0]
}

/**
 * 한국시간 기준 날짜를 UTC 기준 날짜로 변환합니다.
 *
 * @param koreanDate 한국시간 기준 날짜 문자열 (YYYY-MM-DD)
 * @returns UTC 기준 날짜 문자열 (YYYY-MM-DD)
 */
export function koreanToUtcDate(koreanDate: string): string {
  const date = new Date(koreanDate + "T00:00:00+09:00")
  return date.toISOString().split("T")[0]
}

/**
 * 한국시간 기준 날짜가 미국 시장 종가 기준으로 전날인지 확인합니다.
 * 한국시간 자정~오전 7시(서머타임 6시) 사이는 전날 미국 시장 종가에 해당합니다.
 *
 * @param koreanDate 한국시간 기준 날짜 문자열 (YYYY-MM-DD)
 * @returns 전날 미국 종가이면 true
 */
export function isPreviousUsMarketClose(koreanDate: string): boolean {
  const date = new Date(koreanDate + "T00:00:00+09:00")
  const utcHours = date.getUTCHours()

  // 한국 자정(UTC 15시) ~ 한국 오전 7시(UTC 22시, 서머타임 21시)
  // 이 시간대는 전날 미국 시장 종가에 해당
  return utcHours >= 15 && utcHours < 22
}

/**
 * 기존 UTC 기반으로 저장된 날짜를 한국시간 기반으로 변환합니다.
 * 마이그레이션용 함수입니다.
 *
 * @param utcDate UTC 기준 날짜 문자열 (YYYY-MM-DD)
 * @returns 한국시간 기준 날짜 문자열 (YYYY-MM-DD)
 */
export function migrateUtcToKoreanDate(utcDate: string): string {
  // UTC 날짜를 한국시간으로 변환하면 9시간 더해짐
  const date = new Date(utcDate + "T00:00:00Z")
  const koreanTime = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString().split("T")[0]
}
