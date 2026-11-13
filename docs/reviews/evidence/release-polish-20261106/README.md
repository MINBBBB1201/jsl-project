# 상담 구간·개인정보 안내 실제 캡처

2026-11-06. 기존 로컬 운영 빌드에서 before CTA3장을, 변경된 `next build --webpack`에서 after CTA3장과 privacy2장을 캡처했다. 실제 회사 정책이나 운영 배포 승인이 아니다.

- CTA: en1440×1000 light, vi390×844 light, ko390×844 dark. 기존 제목·설명·서비스·수치·버튼 링크를 유지하고 작은 배지와 다색 표시등을 제거했다.
- 개인정보: en1440×1000, ko390×844. 회사 미확정 보유기간·담당자·시행일을 숨기고 준비 중 안내를 표시했다. 법적 방침 확정이 아니다. 기존 약관 본문은 변경하지 않았다.
- before-results.json에는 변경 전 실제 서버가 렌더한 정책 본문도 들어 있다. 초기 privacy 캡처2장은 로딩 화면이라 비교 증거에서 제외했다. after는 article 표시 후 다시 캡처했다.
- 모든 CTA 캡처에서 페이지 오류·가로 넘침0. en PC와 vi 모바일에서 두 CTA 링크를 키보드 Enter로 열어 #contact/#features 도착을 확인했다(4조건). 문의 API는 이 시각 캡처에서 차단했으며 폼 성공 증거가 아니다.

## 전후 비교

| 화면 | 변경 전 | 변경 후 |
| --- | --- | --- |
| PC | [before](before-cta-en-1440-light.png) | [after](after-cta-en-1440-light.png) |
| 모바일 | [before](before-cta-vi-390-light.png) | [after](after-cta-vi-390-light.png) |
| 다크 | [before](before-cta-ko-390-dark.png) | [after](after-cta-ko-390-dark.png) |

개인정보 [PC](after-privacy-en-1440.png)·[모바일](after-privacy-ko-390.png), [키보드 측정](keyboard-results.json).
