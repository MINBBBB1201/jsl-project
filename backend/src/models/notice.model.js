const mongoose = require("mongoose");

const { NOTICE_CATEGORIES } = require("../config/notices");

/**
 * 공지사항.
 *
 * draft(isPublished:false) → published(isPublished:true, publishedAt 부여)
 * 흐름이다. 공개 목록/상세는 published 만 내려준다 — draft 는 관리자 전용
 * 목록(/api/notices/all)에서만 보인다.
 */
const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 20000 },
    category: {
      type: String,
      enum: NOTICE_CATEGORIES,
      default: "general",
    },
    isPinned: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

noticeSchema.index({ isPublished: 1, isPinned: -1, publishedAt: -1 });

/** isPublished 가 바뀌는 저장에서만 publishedAt 을 맞춰 넣거나 지운다. */
noticeSchema.pre("save", function syncPublishedAt(next) {
  if (this.isModified("isPublished")) {
    this.publishedAt = this.isPublished ? this.publishedAt || new Date() : null;
  }
  next();
});

noticeSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    title: this.title,
    body: this.body,
    category: this.category,
    isPinned: this.isPinned,
    isPublished: this.isPublished,
    publishedAt: this.publishedAt,
    createdBy: this.createdBy ? this.createdBy.toString() : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Notice", noticeSchema);
