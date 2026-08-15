import { Package, Truck, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DelayRiskCard } from "./delay-risk-card"

// TODO: 처리 화물 건수 / 온타임 배송률 / 활성 배송 건수는 아직 정적 더미값이다.
//       지연 예상 건수만 실제 API(/api/shipments/delay-summary)와 연결돼 있다.
//       실제 배송 이력 데이터를 받으면 나머지 3개도 API 로 교체해야 한다.
export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>처리 화물 건수</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            12,480
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            이번 달 처리량 증가 <Package className="size-4" />
          </div>
          <div className="text-muted-foreground">
            최근 30일 누적 화물 처리 건수
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>온타임 배송률</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            96.4%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +1.8%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            목표 95% 상회 <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            약속 기일 내 완료된 배송 비율
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>활성 배송 건수</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,342
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +5.1%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            현재 운송 중 <Truck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            집하 완료 후 배송 진행 중인 건수
          </div>
        </CardFooter>
      </Card>
      <DelayRiskCard />
    </div>
  )
}
