import type { Metadata } from 'next'

import { TrackingClient } from './tracking-client'

export const metadata: Metadata = {
  title: '화물 추적 - JSL Logistics',
  description:
    '운송장번호로 화물의 현재 운송 상태와 예상 도착일을 확인하실 수 있습니다.',
}

export default function TrackingPage() {
  return <TrackingClient />
}
