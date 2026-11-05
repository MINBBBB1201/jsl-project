const express = require("express");

function createRequestBodyParser() {
  const json = express.json({ limit: "10kb" });
  const urlencoded = express.urlencoded({ extended: true, limit: "10kb" });
  return (req, res, next) => {
    // The contact router owns its size limit, media type and public parser errors.
    if (req.path === "/api/contact" || req.path.startsWith("/api/contact/"))
      return next();
    json(req, res, (error) =>
      error ? next(error) : urlencoded(req, res, next),
    );
  };
}
module.exports = { createRequestBodyParser };
