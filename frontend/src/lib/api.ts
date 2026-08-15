/**
 * 백엔드 API 베이스 URL.
 * 개발 기본값은 http://localhost:5000 이며, 배포 시 NEXT_PUBLIC_API_URL 로 덮어쓴다.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
