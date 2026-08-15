const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  companyName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  contactName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 320
  },
  subject: {
    type: String,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
