import { NotFoundContent } from "@/components/not-found-content";
import { RootDocument, rootMetadata } from "@/components/layout/root-document";

export const metadata = rootMetadata;

/**
 * 어느 루트 레이아웃에도 걸리지 않은 URL 의 404.
 *
 * 루트 레이아웃이 여럿이면 app/not-found.tsx 를 감쌀 레이아웃이 없어서, Next 는
 * 이 파일을 <html> 부터 직접 그리게 한다 (next.config 의 experimental.globalNotFound).
 */
export default function GlobalNotFound() {
  return (
    <RootDocument lang="ko">
      <NotFoundContent />
    </RootDocument>
  );
}
