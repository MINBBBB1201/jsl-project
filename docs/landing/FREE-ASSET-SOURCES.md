# 무료 물류 자산: 실제 확보와 검증

확인: 2026-10-06. 계정 생성·유료 구독·대형 팩·플러그인 설치 없이 공식 공개 다운로드를 확인했다. **현재 제약에서 확보와 로컬 검증을 모두 완료한 사실적 트랙터 GLB는 없다.** validator 통과는 형식 검증이며 사실성이나 장비 동작의 품질을 보장하지 않는다.

## 실제 파일

원본 보존 폴더: `tools/landing-review/artifacts/logistics-models-20261006/`. 해시·정확한 다운로드 URL·validator 결과는 같은 폴더의 `asset-provenance.json`에 있다.

| 파일 | 공식 출처·라이선스 | 실제 확인 | 선택 상태 |
|---|---|---|---|
| `innerscene-semi-trailer.glb` — 1,393,828 B | [Innerscene 원본](https://www.innerscene.com/tools/library/3d-parts/semi-tractor-and-box-trailer-bc0bdac8), [CC0 조건](https://www.innerscene.com/tools/library/terms) | GLB errors 0 / warnings 0. 실제 제공자 WebGL 뷰어 캡처 `provider-view.png`. 198 meshes, 10 materials, texture 0 | 직육면체 캡과 단색 재질이 보여 사실성 미달. 장면에 채택하지 않음. 승인된 원본 보존용 복사만 수행 |
| `cabover-sleeper.glb` — 186,556 B | [3DAssets 원본·CC0 표시](https://3dassets.dev/assets/long-haul-trucking-and-truck-stop-cabover-sleeper-b86f0719) | GLB errors 0 / warnings 0. Texture 0. 출처는 AI 생성으로 명시 | 사실적인 트랙터로 선택하지 않음 |
| `container-chassis-40ft.glb` — 139,548 B | [3DAssets 원본·CC0 표시](https://3dassets.dev/assets/long-haul-trucking-and-truck-stop-container-chassis-tr-1a6d7e81) | GLB errors 0 / warnings 0. Texture 0. 출처는 AI 생성으로 명시 | 실제 시각 품질·별도 컨테이너 구조는 미검수. 장면에 채택하지 않음 |
| `studio-small-09-1k.hdr` — 1,615,248 B | [Poly Haven 원본](https://polyhaven.com/a/studio_small_09), [CC0](https://polyhaven.com/license), [공식 파일 메타데이터](https://api.polyhaven.com/files/studio_small_09) | 실제 파일 MD5 `d5d7eb9d26d341d6aa4d11c1a54fd97c`가 공식 값과 일치 | 로컬 조명 자산으로 준비. 실제 장면 조명 결과는 별도 검수 필요 |

신규 복사 경로는 `frontend/public/images/landing/industrial/truck-original.glb` 및 `studio-small-09-1k.hdr`다. 원본과 복사본이 바이트 단위로 일치함을 확인했다. 기존 자산을 덮어쓰지 않았다. 코드나 런타임 외부 API 연결을 추가하지 않았다.

## 추가 사실적 후보 한 개: 미확보

[Meshy White Semi Truck](https://www.meshy.ai/3d-models/019d4979-73db-7b2c-b958-681e1f713cb5) — 제작자 `2018vntrungvo`, 공식 페이지 표시 `CC0`, `Meshy 6`.

- **관찰:** 공개 WebGL 뷰어에서 둥근 캡, 앞유리, 그릴, 타이어 및 텍스처를 실제 확인했다. 기존 블록 모델보다 현실적인 형태이나 표면과 세부 형상에 AI 생성 특유의 불규칙함이 보인다. 캡처: `meshy-white-truck-viewer.png`.
- **관찰:** 뷰어 표시 1,503,432 triangles / 901,441 vertices. 웹 랜딩용으로 그대로 사용하기에는 무겁다고 판단한다.
- **실제 다운로드 확인:** GLB 포맷 선택 후 다운로드 버튼을 누르면 가입·로그인 모달이 나타났다. 계정 없이 파일을 받을 수 없으므로 중단했다. 미로그인 프리뷰 파일을 별도로 추출하지 않았다.
- **미확인:** 실제 GLB 크기·해시·validator·텍스처 구조·메시 분리·사용 가능한 LOD. 다운로드되지 않은 파일을 확보한 자산으로 기재하지 않는다.

현재 장면은 승인된 고품질 cutout과 사진 배경을 이용한 2.5D 구성을 선택할 수 있다. 이는 실제 트랙터 GLB를 확보한 결과가 아니며, 트랙터의 자유 회전이나 차륜 관절 동작을 검증한 것으로 설명하지 않는다.

## 원본 트럭 구조 참고

`truck-parts.json`은 실제 GLB JSON에서 추출한 노드·재질·POSITION accessor bounds다. glTF의 +Y가 위, 캡 전방은 +Z다. 제공자 명목 크기는 3.3 × 17 × 4 m.

- `14 Box trailer`; rear doors `43–44 Rear door`; rear lock rods `17–20 Door lock rod`. 몸통 14만 숨겨도 문과 잠금 봉은 남는다.
- `49 Tractor sleeper cab`, `48 Tractor ladder frame`, `23 Fifth wheel`, `197 Windshield`.
- 트랙터 tire meshes `116–121 Tractor wheel_tire`; trailer tire meshes `191–196 Trailer wheel_tire`. 위치가 geometry에 들어 있으므로 translation이 없는 노드를 원점에 있는 차륜으로 해석하지 않는다.
- 주요 재질: `orange`, `white`, `glass`, `chrome`, `steel`, `black`, `lamp`, `tail`, `blue`, `rubber`. 외부 이미지 텍스처가 없다.

## 재사용 검수

```powershell
Set-Location 'C:/Users/mimin/Desktop/jsl-project/tools/landing-review'
node ./asset-check.mjs ./artifacts/logistics-models-20261006/innerscene-semi-trailer.glb
node ./asset-check.mjs ./artifacts/logistics-models-20261006/cabover-sleeper.glb
node ./asset-check.mjs ./artifacts/logistics-models-20261006/container-chassis-40ft.glb
Get-FileHash -Algorithm SHA256 ./artifacts/logistics-models-20261006/studio-small-09-1k.hdr
Get-FileHash -Algorithm MD5 ./artifacts/logistics-models-20261006/studio-small-09-1k.hdr
```
