# 통합본 자산의 사용 범위

기준: `8ba4e84`의 앱 소스. 정적 import·mount·엔진 경로를 확인했다. 파일 삭제·이미지 교체·폰트 다운로드·약관의 법률 판단은 하지 않았다.

| 구분 | 파일 | 근거와 처리 |
| --- | --- | --- |
| 실제 엔진 사용 | `images/multimodal/port.webp`, `warehouse.webp` | 엔진 assets 맵과 단계별 photo.src 경로. 사용자 제외 범위이므로 교체·삭제하지 않는다. |
| 실제 엔진 사용 | `truck-preview.avif`, `truck-top.webp`, `roof-quality.avif`, `plane.avif`, `cloud-left/right.avif` | 엔진 assets 및 마크업 참조. 현재 truck-top은 생성 트랙터이며 과거 거절된 CC0 후보가 아니다. |
| 실제 해상 사용 | `sea-vessel-photo.webp`, `sea-coating.jpg`, `sea-environment.hdr` | Three.js 렌더에도 이미지·재질 자산이 연결된다. 렌더러 종류로 이미지 권리 검토를 생략하지 않는다. |
| 조건부 사용 | `vessel-hold-photographic.jpg`, `vessel-fallback-mobile.jpg` | WebGL 대체 경로. 정상 WebGL에서 안 보여도 삭제 대상이 아니다. |
| 조건부 사용 | `images/landing/industrial/` | `multimodal-journey.tsx`의 동작 줄이기 fallback이 IndustrialJourney를 렌더한다. 폴더 전체를 미사용으로 분류하지 않는다. |
| 현재 mount 없음 | `images/journey/` 23파일, 1,045,960 bytes | 기존 Journey 장면 컴포넌트에 참조는 남지만 현재 페이지는 해당 이미지 장면을 mount하지 않는다. 공개 폴더에는 여전히 남는다. |
| 현재 mount 없음 | Emons 2파일 11,511,501 bytes / Freezpak 2파일 2,925,362 bytes | 보관 컴포넌트·CSS 외 현재 호출 경로 없음. 삭제 승인이나 사용 허가를 의미하지 않는다. |

`journey/sources.json`은 과거 UC 수집 목록이다. 그중 plane/cloud-left/cloud-right의 현재 파일은 multimodal의 Gemini 생성 대체 파일과 해시가 같으므로, 과거 URL을 현재 바이트의 출처로 해석하면 안 된다. 실제 정리 시 보관 코드·메타데이터·직접 URL 노출까지 함께 처리해야 한다.

## GeneralSans 범위 보완

엔진은 `public/images/multimodal/GeneralSans-400/700.woff2`를 쓴다. 전역 `src/lib/fonts.ts`는 `src/fonts/GeneralSans-400/500/600/700.woff2` 네 파일을 로드한다. 기존 #36의 두 파일 검토만으로 전역 폰트 검토까지 완료할 수 없다. 400/700은 엔진 파일과 해시가 같고 추가 두 파일은 다음과 같다.

- 500 SHA-256: `c30377df1de8444d07161725c751f458beec07c28034df2fd275d1aa587a239f`
- 600 SHA-256: `94a2a0e1ef59728eb65498ed7fe26e5af7e2858a3a4a278a89ac1f83a0544945`

위 500/600은 후속 조사에서 공식 CDN 바이트와도 일치했다. 기존 400/700 대조와 합쳐 네 두께의 파일 정체 확인은 완료했다. 상세 URL과 방법은 font-evidence-followup-20261106.md에 기록했다. 회사 취득·동의와 저장소 재배포 조건은 확인이 남는다. Poly Haven CC0 표기는 기존 출처 문서를 대조한 것이며 공식 원문을 새로 검증하지 않았다. 생성 자산도 생성 기록과 적용 약관 확인을 구분한다.
