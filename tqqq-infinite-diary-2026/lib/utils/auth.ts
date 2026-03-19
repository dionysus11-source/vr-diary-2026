import { v4 as uuidv4 } from 'uuid'

const DEVICE_ID_KEY = "vr_diary_device_id"

/**
 * 브라우저 환경에서 장치 고유 ID(UUID)를 가져오거나 없으면 새로 생성하여 저장합니다.
 * 이 ID는 서버 측에서 사용자를 식별하는 키로 사용됩니다.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "" // SSR이나 서버 환경 대비
  }
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = uuidv4()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  
  return deviceId
}

/**
 * 특정 ID로 로그인(복구)하기 위한 유틸리티.
 * 백업데이터 복원 시 다른 기기의 ID를 덮어쓸 수 있도록 지원합니다.
 */
export function setDeviceId(id: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(DEVICE_ID_KEY, id)
}
