# 현재 해상65% 실행 확인

2026-11-06, 앱 코드bcaba55 기준. 현재 앱65%·1440×900·DPR1을 실제 캡처했다. nativeReady=true, nativeFallback=false, HDR/daylight ready, photoVessel ready, canvas1440×900을 확인했다. 페이지 오류·가로 넘침0이었다.

외부 보관본 `D:/CodexScratch/jsl-uc-20261020/wavelets/full-v1/wavelets-desktop-65.receipt.json`의 카메라와 대조했다. position/target/up/rightVector·직교 투영 범위·near/far/zoom·화물 투영·선박 bounds 등18개 항목이 정확히 같았다. [대조값](camera-comparison.json). 해당48샘플 정지 렌더를 앱 자산으로 복사하지 않았다.

중요한 차이는 렌더 방식이다. 현재9draw calls/18triangles와 보관 렌더109calls/228384triangles는 같지 않다. 65%에서는 선택 선박 사진 평면이 준비돼 원래 선체·선실 모델을 숨긴다. MeshBasicMaterial이고 toneMapped=false라 HDR이나 숨은 모델의 도장·선실만 바꿔서는 낡은 사진 인상을 바꾸기 어렵다.

물은 현재 실시간 셰이더이고 정지plate는 꺼져 있다. 사진/모델 선택과 물 표현을 별도 작업으로 다뤄야 한다. 사진 자산 변경이나 새 렌더를 수행한 것이 아니며 이 캡처를 품질 개선 후 결과로 제시하지 않는다.

처음 캡처 도구는 도로 구간에서 아직 숨겨진canvas를 기다려 멈췄다. DOM부착 후65%로 이동하고 실제 준비 상태를 기다리도록 고쳤다. 이후 검수 서버 프로세스가 없어 한 번 연결이 거부됐다. 로그에는 종료 원인이 없었다. 실행중인 소유 서버가 없음을 확인한 후 이 세션의 남은 잠금만 정리해 복구했다.

[현재 앱 화면](current-app-65-1440.png), [실행 상태](current-app-65.json). source의 '.mm-native-poster img' 표시 값은 자식 이미지 자체의 상태이므로 부모 숨김이나 실제 fallback 여부를 대신하지 않는다.
