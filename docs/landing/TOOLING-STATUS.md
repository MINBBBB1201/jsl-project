# JSL 개발·검수 환경 · 2026-10-05

## 사용 가능한 도구

| 구분 | 준비된 기능 | 확인 범위 |
|---|---|---|
| Playwright MCP | 화면 크기 고정, 브라우저 조작·캡처, 세션 영상 | 전용 Chrome 실행, 격리된 테스트 페이지 녹화, 녹화 파일 프레임 추출 통과 |
| Chrome DevTools MCP | 성능 trace, 콘솔·네트워크, Lighthouse 접근성/SEO | 기존 30개 도구 조회와 브라우저 실행 확인. 실제 랜딩 audit는 이번에 실행하지 않음 |
| Context7 MCP | 버전에 맞는 라이브러리 문서 | GSAP 검색과 Next.js 16.1.1 문서 조회 응답 확인 |
| Next.js DevTools MCP | 개발 서버 내부 오류·라우트·메타데이터 조회 | 서버 등록·4개 도구 조회·탐색 API 응답 확인. 현재 개발 서버 없음 |
| Pixelmatch + Sharp | 캡처 차이 이미지, 이미지 형식·크기·알파·디코딩 확인 | 차이 검출, 서로 다른 크기 거부, 이미지 디코딩 통과 |
| glTF Transform + Khronos Validator | GLB/glTF 검사, 모델·텍스처 최적화 CLI | CLI 4.5.1 실행, 유효 모델 통과·잘못된 버전 모델 거부 |
| FFmpeg | 영상 처리·프레임 시퀀스 추출 | 인코딩, 합성 테스트 영상/실제 MCP 녹화 파일의 프레임 추출 통과 |
| Vercel 플러그인 | 프로젝트·배포·빌드 로그 조회 | 계정 응답과 `jsl-logistics-frontend` 조회 확인 |
| 기존 Figma·GitHub·visualize·UI/UX 스킬 | 디자인 비교·저장소 작업·초안 표시·검수 | 기존 설치 도구를 유지. 개별 Figma 파일 권한은 확인하지 않음 |

공식 자료: [Next.js MCP](https://nextjs.org/docs/app/guides/mcp), [Playwright 영상](https://playwright.dev/docs/videos), [Pixelmatch](https://github.com/mapbox/pixelmatch), [glTF Transform CLI](https://gltf-transform.dev/cli), [FFmpeg 바이너리 패키지](https://github.com/eugeneware/ffmpeg-static).

## 재사용 명령

```powershell
Set-Location 'C:\Users\mimin\Desktop\jsl-project\tools\landing-review'

# 도구 정상 작동 확인
npm run verify:mcp
npm run verify:pipeline
npm run verify:scope

# 동일 크기로 캡처한 두 이미지의 차이 기록
npm run image:diff -- before.png after.png artifacts/difference.png

# 이미지 또는 모델 검사
npm run asset:check -- container.glb
npm run asset:check -- container.webp

# 모델 분석 및 별도 출력 파일로 최적화: 원본 경로를 출력 경로로 재사용하지 않음
npm run gltf -- inspect container.glb
npm run gltf -- optimize container.glb container.optimized.glb

# 녹화 영상에서 초당 1장, 최대 12장의 이미지 추출
npm run video:frames -- recording.webm artifacts/frames
```

Pixelmatch 차이 비율은 검토 보조 자료다. 다른 레퍼런스와 JSL의 색·텍스트 차이까지 계산되므로, 숫자가 작다는 이유로 미적 완성도나 장비 접촉을 통과시키지 않는다. 화물/집게/트레일러의 접촉과 비율은 고정 화면 크기의 실제 장면 캡처·연속 프레임에서 확인한다.

## 다음 작업에서의 사용 순서

1. 승인한 레퍼런스 구간과 보존 범위를 확인한다.
2. 화면 크기를 맞추고 원본·시안의 시작/중간/끝 캡처와 세션 영상을 확보한다. 브라우저 종료 시 영상 저장을 확인한다.
3. 이미지·모델 검증과 픽셀 차이 표시를 실행한다.
4. Next.js 개발 서버가 실행되면 Next.js MCP로 내부 오류와 라우트를 확인한다. 탐색이 안 되면 실제 개발 서버의 포트를 지정한다. 이때 업그레이드나 설정 변경을 자동 수행하지 않는다.
5. 실제 구현 변경 후 Chrome DevTools에서 성능 trace와 Lighthouse를 수행한다. 접근성/SEO 점수와 실제 사용성 검토를 구별한다.
6. 기존 프로젝트의 tsc/lint/build/test와 변경 범위 해시 비교를 수행한다.

## 확인 결과와 제한

- 상세 결과: `tools/landing-review/artifacts/mcp-verification.json`, `pipeline-verification.json`.
- 설치된 패키지는 개발 도구 폴더에 격리했다. 운영 프론트엔드 package/lockfile·히어로·14번·다른 장면을 수정하지 않았다. 이전 기준의 621개 파일 해시가 모두 일치했다.
- 신규 도구 JS 문법 검사는 통과했다. 운영 프론트엔드 tsc/lint/build/test는 이번에 실행하지 않았다. 소스 변경 없이 도구 기능만 검증했기 때문이다.
- Playwright 기본 Edge 실행이 종료되는 문제를 확인하고, 설치된 전용 Chrome for Testing으로 교체해 재검증했다.
- Chrome의 실험적 screencast는 EPIPE 오류로 제외했고, Playwright의 표준 recordVideo 방식으로 교체했다. 테스트 브라우저 녹화는 50,061바이트 WebM으로 저장됐고 프레임으로 디코딩됐다.
- Next.js MCP는 설치·등록이 완료됐지만 현재 앱 서버가 없어 런타임 연결은 대기 상태다. 서버가 실행되어야 앱 내부 정보를 읽을 수 있다.
- Vercel에서 기존 프로젝트만 조회했다. 현재 로컬 저장소와 원격 프로젝트의 연결 일치 여부, 배포 권한, 운영 배포는 검증하거나 변경하지 않았다.
- 신규 MCP와 변경된 브라우저 설정을 현재 대화에 반영하려면 Codex MCP 서버를 재시작해야 할 수 있다. 설치/등록과 실제 대화의 활성 도구 목록을 구분한다.
- Blender·Spline·Storybook·Sentry의 관련 설치 가능한 플러그인은 이번 검색에서 발견하지 못했다. 도구 검색 결과는 전체 생태계 목록이 아니다. 3D 모델 제작 프로그램이나 원본 모델을 설치한 상태라고 주장하지 않는다. 현재 3D 준비 범위는 모델 파일 검수·최적화다.
