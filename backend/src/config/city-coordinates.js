/**
 * 화물 업로드 양식의 도시 이름 → 좌표 표.
 *
 * Shipment 모델은 출발·도착·현재 위치의 좌표(GeoJSON Point)가 필수인데, 운영자가
 * 엑셀 양식에 위도·경도를 손으로 적게 하면 오입력이 잦고 쓰기도 불편하다. 그래서
 * 양식에는 도시 이름만 받고 좌표는 이 표에서 찾는다.
 *
 * ⚠️ 표에 없는 도시는 그 행을 오류로 돌려보낸다(임의 좌표로 채우지 않는다).
 *    좌표가 틀리면 지도·최근접 검색이 조용히 틀어지기 때문이다. 필요한 도시는
 *    여기에 추가한다. 값은 도시 중심의 대략적 좌표(소수 둘째 자리)다.
 *
 * 좌표 순서는 GeoJSON 규칙대로 [경도, 위도]다.
 */

/** [경도, 위도, 표시용 주소] */
const CITIES = {
  // 한국
  서울: [126.98, 37.57, "Seoul, KR"],
  인천: [126.71, 37.46, "Incheon, KR"],
  부산: [129.08, 35.18, "Busan, KR"],
  평택: [127.11, 36.99, "Pyeongtaek, KR"],
  광양: [127.7, 34.94, "Gwangyang, KR"],
  대구: [128.6, 35.87, "Daegu, KR"],
  // JSL 해외 거점과 주요 중국·동남아 도시
  상하이: [121.47, 31.23, "Shanghai, CN"],
  위해: [122.12, 37.51, "Weihai, CN"],
  광저우: [113.26, 23.13, "Guangzhou, CN"],
  칭다오: [120.38, 36.07, "Qingdao, CN"],
  톈진: [117.2, 39.08, "Tianjin, CN"],
  선전: [114.06, 22.54, "Shenzhen, CN"],
  하노이: [105.85, 21.03, "Hanoi, VN"],
  호치민: [106.7, 10.78, "Ho Chi Minh City, VN"],
  하이퐁: [106.68, 20.86, "Hai Phong, VN"],
  // 유럽(철송·특송 구간)
  바르샤바: [21.01, 52.23, "Warsaw, PL"],
  말라셰비체: [23.55, 52.1, "Malaszewicze, PL"],
  함부르크: [9.99, 53.55, "Hamburg, DE"],
  로테르담: [4.48, 51.92, "Rotterdam, NL"],
  // 그 밖의 주요 도착지
  도쿄: [139.69, 35.69, "Tokyo, JP"],
  로스앤젤레스: [-118.24, 34.05, "Los Angeles, US"],
};

/** 영문 표기·흔한 별칭 → 표의 한글 키 */
const ALIASES = {
  seoul: "서울",
  incheon: "인천",
  busan: "부산",
  pyeongtaek: "평택",
  gwangyang: "광양",
  daegu: "대구",
  shanghai: "상하이",
  weihai: "위해",
  威海: "위해",
  guangzhou: "광저우",
  qingdao: "칭다오",
  tianjin: "톈진",
  shenzhen: "선전",
  hanoi: "하노이",
  "ho chi minh": "호치민",
  "ho chi minh city": "호치민",
  "hai phong": "하이퐁",
  haiphong: "하이퐁",
  warsaw: "바르샤바",
  warszawa: "바르샤바",
  malaszewicze: "말라셰비체",
  hamburg: "함부르크",
  rotterdam: "로테르담",
  tokyo: "도쿄",
  "los angeles": "로스앤젤레스",
};

const normalize = (name) =>
  String(name ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

/**
 * 도시 이름으로 GeoJSON Point 를 만든다. 없으면 null.
 * @param {string} name 한글·영문 도시명
 */
function resolveCity(name) {
  const key = normalize(name);
  if (!key) return null;

  const koreanKey =
    Object.keys(CITIES).find((city) => normalize(city) === key) ||
    ALIASES[key] ||
    ALIASES[String(name).trim()];
  const entry = koreanKey && CITIES[koreanKey];
  if (!entry) return null;

  const [lng, lat, address] = entry;
  return {
    type: "Point",
    coordinates: [lng, lat],
    address,
    timestamp: new Date(),
  };
}

/** 양식 안내 시트에 보여 줄 도시 목록 */
const listCityNames = () => Object.keys(CITIES);

module.exports = { resolveCity, listCityNames, CITIES };
