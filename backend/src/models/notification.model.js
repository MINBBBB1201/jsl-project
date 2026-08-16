const mongoose = require('mongoose');

/**
 * 인앱 알림.
 *
 * 운영자가 놓치면 안 되는 사건(신규 문의, 지연 위험, 배송 완료, 방치된 화물)을
 * 기록해 두고 대시보드 종 아이콘에 띄운다.
 *
 * 지금은 저장 + 화면 표시까지만 한다. 이메일/Slack 발송은 자격증명이 더 필요해
 * 범위에서 뺐지만, 알림 생성 지점이 notification.service 한 곳으로 모여 있어
 * 나중에 그 서비스 안에서 전송만 추가하면 된다.
 */

const NOTIFICATION_TYPES = {
  CONTACT: 'contact',                 // 신규 문의 접수
  DELAY_RISK: 'delay-risk',           // 지연위험/지연 감지
  DELIVERED: 'delivered',             // 배송 완료
  STALE_SHIPMENT: 'stale-shipment'    // 오래 갱신되지 않은 운송 중 화물
};

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedShipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment'
    },
    /** 화면에 바로 표시하려고 함께 저장한다 (알림 목록에서 화물을 다시 조회하지 않도록) */
    relatedTrackingNumber: {
      type: String,
      trim: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    /**
     * 중복 방지 키.
     *
     * 예: 'delay-risk:DEMO-0001-AIR:2026-08-16' (KST 날짜 기준)
     * 지연 위험은 화물이 배송될 때까지 매 조회·매 스캔마다 조건을 만족하므로,
     * 키가 없으면 같은 화물 알림이 하루에도 수십 건씩 쌓인다. 유니크 인덱스로
     * 막으면 여러 프로세스가 동시에 스캔해도 한 건만 남는다.
     *
     * sparse — 키가 필요 없는 알림(문의 등)은 이 필드 없이 저장된다.
     */
    dedupeKey: {
      type: String,
      index: { unique: true, sparse: true }
    }
  },
  { timestamps: true }
);

// 목록은 항상 "최신순 + 안읽음 우선" 으로 조회한다
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
