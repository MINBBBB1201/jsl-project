import { redirect } from "next/navigation";

/**
 * 루트 진입점.
 *
 * 평소에는 미들웨어가 '/' 를 /landing 으로 넘겨서 여기까지 오지 않는다.
 * 미들웨어를 타지 않는 경로(정적 프리렌더 등)에서도 대시보드가 아니라 공개
 * 랜딩이 나오도록 같은 목적지로 맞춰 둔다.
 */
export default function HomePage() {
  redirect("/landing");
}
