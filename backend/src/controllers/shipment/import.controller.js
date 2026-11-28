const Shipment = require("../../models/shipment.model");
const logger = require("../../utils/logger");
const {
  buildTemplate,
  readWorkbook,
  validateRows,
} = require("../../utils/shipment-import");

/** xlsx 는 zip 이라 파일이 "PK" 로 시작한다. 확장자·mimetype 은 믿지 않는다. */
const looksLikeXlsx = (buffer) =>
  buffer && buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;

/** GET /api/shipments/import/template — 빈 양식 내려받기 */
exports.downloadTemplate = async (req, res) => {
  try {
    const buffer = await buildTemplate();
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="jsl-shipment-template.xlsx"',
    });
    res.send(buffer);
  } catch (error) {
    logger.error("Shipment template error:", error);
    res.status(500).json({ success: false, error: "양식을 만들지 못했습니다." });
  }
};

/**
 * POST /api/shipments/import[?dryRun=true] — 화물 xlsx 업로드
 *
 * 전부 아니면 전무: 오류가 한 행이라도 있으면 422 와 오류 목록만 돌려주고 저장하지
 * 않는다. dryRun 이면 검증만 하고 저장하지 않는다(올리기 전에 미리 확인).
 * 이미 등록된 운송장번호는 덮어쓰지 않고 건너뛴다(같은 파일을 다시 올려도 안전).
 */
exports.importShipments = async (req, res) => {
  try {
    if (!req.file || !looksLikeXlsx(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        error: "xlsx 파일을 올려 주세요. 양식을 내려받아 작성할 수 있습니다.",
      });
    }
    const dryRun = req.query.dryRun === "true";

    const rows = await readWorkbook(req.file.buffer);
    const { docs, errors } = validateRows(rows);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        error: `${errors.length}개 오류가 있어 저장하지 않았습니다.`,
        errors,
      });
    }

    const existing = await Shipment.find({
      trackingNumber: { $in: docs.map((doc) => doc.trackingNumber) },
    }).select("trackingNumber");
    const existingSet = new Set(existing.map((s) => s.trackingNumber));
    const toCreate = docs.filter((doc) => !existingSet.has(doc.trackingNumber));
    const skipped = docs
      .filter((doc) => existingSet.has(doc.trackingNumber))
      .map((doc) => ({
        row: doc.rowNumber,
        trackingNumber: doc.trackingNumber,
        reason: "이미 등록된 운송장번호",
      }));

    if (!dryRun) {
      // pre-save 훅(예상 도착일·리스크 스냅샷)이 돌도록 save 로 하나씩 저장한다
      for (const doc of toCreate) {
        // rowNumber 는 오류 안내용이라 문서에 넣지 않는다
        const { rowNumber: _rowNumber, ...fields } = doc;
        await new Shipment(fields).save();
      }
    }

    logger.info(
      `Shipment import by ${req.user?.email || "unknown"}: ` +
        `${dryRun ? "dry-run " : ""}created=${toCreate.length} skipped=${skipped.length}`,
    );
    return res.status(dryRun ? 200 : 201).json({
      success: true,
      data: { dryRun, total: docs.length, created: toCreate.length, skipped },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, error: error.message });
    }
    logger.error("Shipment import error:", error);
    return res
      .status(500)
      .json({ success: false, error: "업로드를 처리하지 못했습니다." });
  }
};
