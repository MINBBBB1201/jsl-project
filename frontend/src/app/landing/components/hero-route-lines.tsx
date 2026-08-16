/**
 * 히어로 배경 — 거점 노선 도해
 *
 * Spline 3D 지구본 대신 직접 그린 SVG 다. 이유는 세 가지다.
 *   1) Spline 런타임은 1MB 가 넘고 외부 호스팅 씬을 런타임에 받아온다.
 *      첫 화면에 붙이면 LCP 를 그대로 밀어낸다.
 *   2) 회전하는 3D 지구본은 지금 웹에서 가장 흔한 AI 생성 클리셰다.
 *      "AI 가 만든 느낌"을 피하는 것이 이번 작업의 첫 기준이었다.
 *   3) 스위스 양식의 뿌리가 항공·철도 시간표와 사인 시스템이다. 실제 거점을
 *      선으로 잇는 도해가 브랜드에 더 정확하다.
 *
 * 실제 5개 거점(서울·위해·상해·광주·하노이)의 상대 위치를 단순화해 배치했다.
 * 지도 투영이 아니라 도해이므로 좌표는 정확한 위경도가 아니다.
 *
 * 장식이므로 aria-hidden 이고, 선 굵기와 투명도는 본문을 방해하지 않는 선에서
 * 눌러 두었다.
 */

/** 거점 — [x, y, 라벨] */
const NODES: [number, number, string][] = [
  [300, 88, "SEL"],
  [252, 104, "WEH"],
  [231, 142, "SHA"],
  [176, 204, "CAN"],
  [121, 236, "HAN"],
]

/** 거점 간 연결 (인덱스 쌍) */
const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 2],
  [2, 4],
]

/** 장거리 노선 — 화면 밖(유럽·미주)으로 빠지는 선 */
const LONG_HAUL = [
  "M 300 88 C 210 40, 120 30, 8 52",
  "M 231 142 C 150 120, 80 130, 8 118",
]

export function HeroRouteLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 거점 간 연결선 */}
      <g stroke="currentColor" strokeWidth={0.6} opacity={0.28}>
        {LINKS.map(([from, to]) => (
          <line
            key={`${from}-${to}`}
            x1={NODES[from][0]}
            y1={NODES[from][1]}
            x2={NODES[to][0]}
            y2={NODES[to][1]}
          />
        ))}
      </g>

      {/* 장거리 노선 — 파선이 아주 느리게 흐른다 (동작 줄이기 설정이면 멈춘다) */}
      <g stroke="currentColor" strokeWidth={0.6} opacity={0.22}>
        {LONG_HAUL.map((d, index) => (
          <path
            key={d}
            d={d}
            strokeDasharray="3 5"
            className="animate-route-dash"
            style={{ animationDelay: `${index * 2}s` }}
          />
        ))}
      </g>

      {/* 거점 */}
      <g>
        {NODES.map(([x, y, label]) => (
          <g key={label}>
            <circle cx={x} cy={y} r={2} fill="currentColor" opacity={0.45} />
            <circle
              cx={x}
              cy={y}
              r={5.5}
              stroke="currentColor"
              strokeWidth={0.5}
              opacity={0.2}
            />
            <text
              x={x + 9}
              y={y + 3}
              fontSize={6}
              letterSpacing={1}
              fill="currentColor"
              opacity={0.35}
            >
              {label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}
