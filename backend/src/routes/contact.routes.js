const Contact = require("../models/contact.model");
const { loadContactPolicies } = require("../config/contact-policy");
const { createContactInquiryRouter } = require("./contact-inquiry.router");
const notificationService = require("../services/notification.service");

// Only approved operational notices can enable intake. No fixture flag is exposed.
module.exports = createContactInquiryRouter({
  policies: loadContactPolicies(),
  ContactModel: Contact,
  notifyReceipt: notificationService.notifyContactReceipt,
});
