# 무료 개발·제작 도구 준비 상태

확인: 2026-10-06. 이번 도구 준비에서는 운영 소스·백엔드·메시지·API·PATH·글로벌 설정·MCP 설정을 변경하지 않았다. 이후 별도로 승인된 트럭 원본 GLB와 HDRI 두 파일을 신규 자산 경로에 복사했다. 유료 구독·계정 생성·사용자 데이터 삭제를 수행하지 않았다.

## 실제 통과한 항목

| 도구 | 실제 확인 | 근거 |
|---|---|---|
| Playwright MCP | 25개 도구 조회·격리 브라우저 실행·36,928바이트 WebM 저장·프레임 추출 | `tools/landing-review/artifacts/mcp-verification.json` |
| Chrome DevTools MCP | 30개 도구 조회·브라우저 목록 응답. `lighthouse_audit` 포함 | 같은 MCP 결과. 실제 랜딩 Lighthouse는 이번에 실행하지 않음 |
| Context7 MCP | 2개 도구 조회·GSAP 검색·공식 ScrollTrigger 문서 응답 | 같은 MCP 결과 및 이번 대화 조회 |
| 이미지·모델·영상 처리 | 디코딩·픽셀 차이·크기 불일치 거부·유효/무효 glTF·인코딩·프레임 추출 7개 항목 | `tools/landing-review/artifacts/pipeline-verification.json` |
| Blender 준비 스크립트 | PowerShell·Node.js·Python 문법 검사 통과. `-CheckOnly`가 공식 SHA-256과 고정 명세 일치를 확인 | `tools/landing-review/artifacts/blender-preparation-verification.json` |

Next.js MCP는 4개 도구 조회가 통과했지만 실행 중인 개발 서버가 발견되지 않아 런타임 오류·라우트 검수는 대기 중이다. Figma는 플러그인 설치 상태만 확인됐으며 계정 조회의 HTTP 전송 실패로 파일 접근은 미검증이다. 기존 image_gen·visualize·UI/UX 스킬을 활용할 수 있어 중복 플러그인을 설치하지 않았다.

## Blender 5.2.2 LTS: 미설치

현재 공식 최신 LTS는 5.2.2이며 2026-09-15 배포, 2028-07까지 지원된다. [공식 LTS](https://www.blender.org/download/LTS/), [공식 릴리스](https://www.blender.org/releases/5-2/), [무료·상업적 사용·등록 불필요 조건](https://www.blender.org/about/license/).

- [Windows x64 portable ZIP](https://download.blender.org/release/Blender5.2/blender-5.2.2-windows-x64.zip): **404,453,484바이트**.
- [공식 SHA-256 목록](https://download.blender.org/release/Blender5.2/blender-5.2.2.sha256).
- 기대 SHA-256: `3849d17a682cba006075aaa3f3597ecb5c9c30ec31035b2e092c53e40679b535`.
- 예정 설치 경로: `C:/Users/mimin/.codex/tools/blender/5.2.2-windows-x64/blender-5.2.2-windows-x64/blender.exe`.
- 명세: `tools/landing-review/blender-portable.manifest.json`.

공식 HTTPS 배포 디렉터리와 체크섬 목록은 실제 읽었고 명세의 해시가 일치했다. C: 여유는 확인 중 약 1.15–1.22 GiB였으며 다른 데이터 드라이브가 없었다. ZIP과 압축 해제본을 함께 보존하기 위한 보수적 3 GiB 조건을 충족하지 않아 다운로드·압축 해제는 하지 않았다. 설치 디렉터리를 만들거나 기존 파일을 덮어쓰지 않았다.

**미확인:** 다운로드한 ZIP의 실제 SHA-256, 실행 파일 버전, Blender 렌더, GLB 내보내기와 그 결과물의 validator 통과. 이 항목을 완료했다고 주장하지 않는다. `blender-smoke.mjs`는 실행 파일이 없을 때 `not-installed`로 종료하는 것을 확인했다.

## 재사용 명령

```powershell
Set-Location 'C:/Users/mimin/Desktop/jsl-project/tools/landing-review'

# 공식 기대 해시·대상 경로·여유 공간만 확인. 다운로드하지 않음.
./setup-blender-portable.ps1 -CheckOnly

# 여유 공간 확보 후 명시적으로 실행. 기존 버전 폴더가 있으면 중단.
./setup-blender-portable.ps1

# 설치된 로컬 바이너리의 버전·320×180 CPU 렌더·GLB export 검사.
# 기존 asset-check.mjs의 이미지 디코딩 및 Khronos validator 사용.
node ./blender-smoke.mjs

# 이미 준비된 검수 도구
npm run verify:mcp
npm run verify:pipeline
```

설치 스크립트는 공식 고정 URL만 사용하며 다운로드 크기와 SHA-256이 맞을 때만 압축을 해제한다. 버전별 폴더와 ZIP을 보존하고, 실패 시 비공식 배포처로 바꾸지 않는다. 설치 완료 상태는 설치 폴더의 `installation.json`, 렌더/export 상태는 새 `artifacts/blender-smoke-<timestamp>/verification.json`에 별도로 남긴다. 샘플은 도구 작동 확인용이며 승인된 장비 동작이나 랜딩 자산이 아니다. 상세 설명은 `tools/landing-review/BLENDER-PORTABLE.md`에 있다.

## 무료 자산 선택지

트럭·컨테이너 후보와 HDRI의 실제 파일 검증, 출처, 라이선스, 채택 여부는 [무료 물류 자산 검증](FREE-ASSET-SOURCES.md)에 기록했다. 작은 CC0 모델 세 개는 validator를 통과했지만 사실적인 트럭 자산으로 채택하지 않았다. 추가 Meshy 후보는 실제 3D 뷰어까지 확인했으나 GLB 다운로드에 가입이 필요해 확보하지 않았다. Poly Haven 1K HDRI는 공식 MD5와 실제 파일이 일치했다.

[Poly Haven 원본 HDRI·텍스처·모델](https://polyhaven.com/license)은 CC0이며 상업적 사용이 가능하다. 원본 파일을 받아 조명과 재질에 사용할 수 있다. 유료 애드온 구매가 필요하지 않으며, 정확한 컨테이너·집게·트레일러 모델이 확보된 것은 아니다. [공식 API 조건](https://github.com/Poly-Haven/Public-API/blob/master/ToS.md)도 현재 무료이나 서비스 내 API 사용 시 식별 헤더·출처 표시 조건이 있어 별도 API 연결을 추가하지 않았다. 사이트 예시 렌더와 원본 CC0 파일은 구분한다.

Blender 관련 설치 가능한 플러그인은 이번 검색에서 발견하지 못했다. 검색은 전체 생태계의 부재를 증명하지 않는다. 현재 목적에는 로컬 Blender CLI와 기존 검수 도구가 직접적인 준비 방식이다.

## 검증 범위와 보존 기준

운영 프론트엔드 tsc/lint/build/test와 실제 모션 품질 검수는 이번 도구 준비의 실행 항목이 아니다. 오래된 `frontend-baseline.json`의 `verify:scope`는 기존 Emons·Freezpak 구현·자산 등을 포함한 18개 차이를 보고했다. 자동 롤백하거나 해당 기준을 덮어쓰지 않았다. 이번 시안 작업의 보존 확인은 현재 작업에서 별도로 저장한 최신 preview scope 기준을 사용한다.
