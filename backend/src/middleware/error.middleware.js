const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendUnexpectedError = (err, res) => {
  try {
    logger.error("ERROR 💥", err);
  } catch {
    // 로그 저장 실패가 공개 오류 응답을 바꾸지 않게 한다.
  }
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};

const notFoundHandler = (_req, _res, next) => {
  next(new AppError("Route not found.", 404));
};

const errorHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);

  try {
    let error = err;
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    if (
      error.isOperational === true &&
      Number.isInteger(error.statusCode) &&
      error.statusCode >= 400 &&
      error.statusCode <= 599 &&
      typeof error.message === "string"
    ) {
      return res.status(error.statusCode).json({
        status: error.statusCode < 500 ? "fail" : "error",
        message: error.message,
      });
    }
  } catch {
    // 정규화 실패도 공통 응답으로 처리해 기본 개발 오류 화면의 노출을 막는다.
  }

  // 개발 모드로 배포됐더라도 원시 오류·스택을 공개 응답에 넣지 않는다.
  sendUnexpectedError(err, res);
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
