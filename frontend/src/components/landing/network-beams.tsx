"use client"

import { motion } from "framer-motion"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * 글로벌 네트워크 연결선 다이어그램
 *
 * 서울 본사를 가운데 두고 네 개 지사로 선이 뻗고, 그 위를 오렌지 빛 펄스가
 * 흐른다. Magic UI 의 Animated Beam 과 같은 인상을 목표로 했지만 구현은 다르다 —
 * 저쪽은 DOM 엘리먼트 두 개의 좌표를 재서 그 사이에 SVG 를 그리는 방식이고,
 * 여기서는 노드 위치를 우리가 정하므로 좌표를 계산할 이유가 없다.
 *
 * ── 지리적 배치가 아니다 ────────────────────────────────────────────────
 * 실제 위경도를 흉내 내면 상해와 위해가 거의 겹쳐서 선 두 개가 붙어 버린다.
 * 서울을 중심에 두고 네 지사를 타원 위에 고르게 벌린 도식이다. "어디에 있나"가
 * 아니라 "본사와 어떻게 이어져 있나"를 말하는 그림이라 이 편이 맞다.
 *
 * ── 펄스를 dash 로 그리는 이유 ──────────────────────────────────────────
 * 선 위를 움직이는 점을 따로 그리면 좌표를 매 프레임 계산해야 한다. 짧은 dash
 * 하나를 dashoffset 으로 밀면 브라우저가 알아서 선을 따라 흘려 준다 — 선이
 * 직선이든 곡선이든 같은 코드로 동작하고, 계산은 브라우저 몫이다.
 *
 * ── 동작 줄이기 ─────────────────────────────────────────────────────────
 * 펄스를 아예 렌더하지 않는다. 연결선·노드·라벨은 그대로라 정보는 남고 움직임만
 * 사라진다.
 */

/**
 * 도식 좌표계
 *
 * 세로를 420 에서 330 으로 줄였다. 노드는 타원 위 ±35° 에 있어서 실제 세로
 * 진폭이 RY 가 아니라 RY·sin35° (= RY 의 57%) 다. 이걸 빼먹고 420 으로 잡았더니
 * 위아래에 아무것도 없는 여백이 40% 씩 남았다.
 */
const VIEW_W = 720
const VIEW_H = 330
const HUB_X = VIEW_W / 2
const HUB_Y = VIEW_H / 2

/**
 * 지사 네 곳의 자리 — 타원 위 네 방향.
 *
 * 가로로 넓은 타원(rx > ry)이라 와이드 화면에서 선이 짧게 뭉치지 않는다.
 * 각도는 대각선 네 방향이고, 위아래로 완전히 대칭이라 어느 지사가 더 중요해
 * 보이는 일이 없다.
 *
 * ⚠️ RX 를 더 키우지 말 것. 라벨이 노드 바깥쪽으로 16px 떨어져 붙는데,
 *    "Guangzhou · 5명" 처럼 긴 라벨은 그 뒤로 130px 을 더 쓴다. RX 268 일 때
 *    오른쪽 라벨이 viewBox 를 넘어 잘렸다.
 */
const RX = 240
const RY = 155
const ANGLES = [-145, -35, 35, 145]

/** 펄스 한 바퀴에 걸리는 시간(초) — 로고 마퀴처럼 느긋하게 */
const PULSE_DURATION = 2.6

/**
 * 노드마다 다른 출발 시각.
 *
 * 넷을 같이 띄우면 신호가 아니라 깜빡이는 장식으로 보인다. 주기의 배수가 아닌
 * 값으로 어긋나게 둬서 겹치는 순간이 자주 오지 않게 했다.
 */
const PULSE_DELAYS = [0, 0.7, 1.5, 2.1]

export interface NetworkNode {
  city: string
  cityEn: string
  headcount: number
}

interface NetworkBeamsProps {
  hub: NetworkNode
  spokes: NetworkNode[]
  /** "명" 등 인원 단위 */
  headcountUnit: string
  /** 도식이 무엇을 보여주는지 — 보조기기용 설명 */
  label: string
}

export function NetworkBeams({
  hub,
  spokes,
  headcountUnit,
  label,
}: NetworkBeamsProps) {
  const reduced = usePrefersReducedMotion()

  const points = spokes.slice(0, ANGLES.length).map((node, index) => {
    const radians = (ANGLES[index] * Math.PI) / 180
    const x = HUB_X + RX * Math.cos(radians)
    const y = HUB_Y + RY * Math.sin(radians)
    return {
      node,
      x,
      y,
      length: Math.hypot(x - HUB_X, y - HUB_Y),
      /** 라벨을 선 바깥쪽으로 밀어낸다 — 왼쪽 노드는 왼쪽, 오른쪽 노드는 오른쪽 */
      anchor: x < HUB_X ? ("end" as const) : ("start" as const),
      labelX: x < HUB_X ? x - 16 : x + 16,
    }
  })

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={label}
    >
      {points.map((point, index) => (
        <g key={point.node.cityEn}>
          {/* 연결선 — 은은한 회색. 다크모드에서도 배경에 묻히지 않게 알파로 준다 */}
          <line
            x1={HUB_X}
            y1={HUB_Y}
            x2={point.x}
            y2={point.y}
            className="stroke-foreground/15"
            strokeWidth={1.5}
          />

          {/*
            펄스 — 짧은 dash 하나가 본사에서 지사 쪽으로 흐른다.
            dasharray 의 두 번째 값이 선 길이보다 길어야 dash 가 한 번에 하나만
            보인다 (짧으면 같은 선에 여러 개가 동시에 나타난다).
          */}
          {reduced ? null : (
            <motion.line
              x1={HUB_X}
              y1={HUB_Y}
              x2={point.x}
              y2={point.y}
              stroke="var(--brand-orange)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={`22 ${point.length}`}
              initial={{ strokeDashoffset: 22 }}
              animate={{ strokeDashoffset: -point.length }}
              transition={{
                duration: PULSE_DURATION,
                delay: PULSE_DELAYS[index],
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </g>
      ))}

      {/* 지사 노드 */}
      {points.map((point) => (
        <g key={`node-${point.node.cityEn}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r={7}
            className="fill-background stroke-foreground/30"
            strokeWidth={1.5}
          />
          <circle cx={point.x} cy={point.y} r={3} className="fill-brand-orange" />
          <text
            x={point.labelX}
            y={point.y - 2}
            textAnchor={point.anchor}
            className="fill-foreground text-[15px] font-semibold"
          >
            {point.node.city}
          </text>
          {/*
            ⚠️ font-poppins 를 <text> 전체가 아니라 <tspan> 에만 준다.
               headcountUnit 은 로케일 문구라 vi 에서 "người", zh 에서 "人" 이
               오는데, Poppins 범위 밖 글자만 폴백으로 떨어져 한 단어 안에서
               서체가 갈렸다 (실측: "2người" 가 Poppins 15 글리프 + Arial 2 글리프).
               영문 도시명과 숫자만 Poppins 로 두고 단위는 본문 서체에 맡긴다.
          */}
          <text
            x={point.labelX}
            y={point.y + 16}
            textAnchor={point.anchor}
            className="fill-muted-foreground text-[12px]"
          >
            <tspan className="font-poppins">
              {point.node.cityEn} · {point.node.headcount}
            </tspan>
            {headcountUnit}
          </text>
        </g>
      ))}

      {/* 본사 — 지사보다 크고 링을 둘러 한눈에 중심으로 읽히게 한다 */}
      <circle
        cx={HUB_X}
        cy={HUB_Y}
        r={26}
        className="fill-brand-orange/10 stroke-brand-orange/40"
        strokeWidth={1.5}
      />
      <circle cx={HUB_X} cy={HUB_Y} r={10} className="fill-brand-orange" />
      <text
        x={HUB_X}
        y={HUB_Y + 52}
        textAnchor="middle"
        className="fill-foreground text-[17px] font-bold"
      >
        {hub.city}
      </text>
      <text
        x={HUB_X}
        y={HUB_Y + 72}
        textAnchor="middle"
        className="fill-muted-foreground text-[12px]"
      >
        <tspan className="font-poppins">
          {hub.cityEn} · {hub.headcount}
        </tspan>
        {headcountUnit}
      </text>
    </svg>
  )
}
