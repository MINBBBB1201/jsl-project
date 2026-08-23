/**
 * 운송모드 상세 페이지의 URL 세그먼트
 *
 * ⚠️ use-service-page.ts 가 아니라 이 파일에 두는 이유가 있다. 저쪽은
 *    "use client" 모듈이라, 서버 컴포넌트가 거기서 값을 import 하면 실제 배열이
 *    아니라 클라이언트 참조 프록시를 받는다 (generateStaticParams 에서
 *    "SERVICE_MODES.map is not a function" 으로 빌드가 깨졌다). 라우트의
 *    generateStaticParams·generateMetadata 는 서버에서 도는 코드이므로,
 *    양쪽이 함께 쓰는 상수는 지시어가 없는 이 파일에 둔다.
 */
export const SERVICE_MODES = ["air", "sea", "truck", "rail", "express"] as const

export type ServiceMode = (typeof SERVICE_MODES)[number]

export function isServiceMode(value: string): value is ServiceMode {
  return (SERVICE_MODES as readonly string[]).includes(value)
}
