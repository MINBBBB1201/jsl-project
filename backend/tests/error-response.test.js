const http = require("node:http");
const express = require("express");
const request = require("supertest");
const logger = require("../src/utils/logger");

const {
  AppError,
  notFoundHandler,
  errorHandler,
} = require("../src/middleware/error.middleware");

const originalMode = process.env.NODE_ENV;
const app = express();
let server;

app.use(express.json({ limit: "1kb" }));
app.post("/json", (_req, res) => res.json({ ok: true }));
app.get("/success", (_req, res) => res.json({ ok: true }));
app.get("/operational", (_req, _res, next) =>
  next(new AppError("Request not allowed.", 409)),
);
app.get("/internal", (_req, _res, next) => {
  const error = new Error("internal diagnostic fixture");
  error.details = { internal: "private fixture detail" };
  next(error);
});
app.get("/cast", (_req, _res, next) => {
  const error = new Error("cast fixture");
  Object.assign(error, {
    name: "CastError",
    path: "shipmentId",
    value: "fixture-value",
  });
  next(error);
});
app.get("/non-enumerable-cast", (_req, _res, next) => {
  const error = new Error("cast fixture");
  Object.defineProperty(error, "name", { value: "CastError" });
  Object.assign(error, { path: "shipmentId", value: "fixture-value" });
  next(error);
});
app.get("/duplicate", (_req, _res, next) => {
  const error = new Error("duplicate fixture");
  Object.assign(error, { code: 11000, errmsg: 'duplicate "fixture-value"' });
  next(error);
});
app.get("/validation", (_req, _res, next) => {
  const error = new Error("validation fixture");
  Object.assign(error, {
    name: "ValidationError",
    errors: { name: { message: "Name is required" } },
  });
  next(error);
});
app.get("/malformed-database-error", (_req, _res, next) => {
  const error = new Error("internal diagnostic fixture");
  error.code = 11000;
  next(error);
});
app.get("/invalid-status", (_req, _res, next) =>
  next(new AppError("internal diagnostic fixture", 200)),
);
app.get("/untrusted-exposed-error", (_req, _res, next) => {
  const error = new Error("internal diagnostic fixture");
  Object.assign(error, {
    statusCode: 400,
    expose: true,
    body: "private fixture body",
  });
  next(error);
});
app.get("/mismatched-parser-error", (_req, _res, next) => {
  const error = new Error("internal diagnostic fixture");
  Object.assign(error, {
    type: "entity.parse.failed",
    statusCode: 500,
    expose: true,
  });
  next(error);
});
app.use(notFoundHandler);
app.use(errorHandler);

beforeAll(async () => {
  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
});

afterAll(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe.each(["development", "production", "test", undefined])(
  "public error envelope with NODE_ENV=%s",
  (mode) => {
    beforeEach(() => {
      if (mode === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = mode;
      app.set("env", mode || "development");
    });

    afterEach(() => {
      if (originalMode === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalMode;
      app.set("env", originalMode || "development");
    });

    test("unexpected errors return a generic response without diagnostics", async () => {
      const response = await request(server).get("/internal");
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: "error",
        message: "Something went wrong!",
      });
    });

    test("operational errors preserve the existing production contract", async () => {
      const response = await request(server).get("/operational");
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        status: "fail",
        message: "Request not allowed.",
      });
    });

    test.each([
      ["malformed JSON", "{", 400, "Invalid JSON request body."],
      [
        "oversized JSON",
        { message: "x".repeat(2048) },
        413,
        "Request body is too large.",
      ],
    ])(
      "body parser %s returns a fixed client error without logging the body",
      async (_label, payload, status, message) => {
        const log = jest.spyOn(logger, "error");
        try {
          const response = await request(server)
            .post("/json")
            .set("Content-Type", "application/json")
            .send(payload);
          expect(response.status).toBe(status);
          expect(response.body).toEqual({ status: "fail", message });
          expect(log).not.toHaveBeenCalled();
        } finally {
          log.mockRestore();
        }
      },
    );

    test.each(["/untrusted-exposed-error", "/mismatched-parser-error"])(
      "untrusted parser-like error %s stays generic",
      async (url) => {
        const response = await request(server).get(url);
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          status: "error",
          message: "Something went wrong!",
        });
      },
    );

    test.each([
      ["/cast", "Invalid shipmentId: fixture-value"],
      ["/non-enumerable-cast", "Invalid shipmentId: fixture-value"],
      [
        "/duplicate",
        'Duplicate field value: "fixture-value". Please use another value!',
      ],
      ["/validation", "Invalid input data. Name is required"],
    ])(
      "database input error %s preserves the public 400 contract",
      async (url, message) => {
        const response = await request(server).get(url);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ status: "fail", message });
      },
    );

    test("normalization failures stay inside the generic JSON error boundary", async () => {
      const response = await request(server).get("/malformed-database-error");
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: "error",
        message: "Something went wrong!",
      });
      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    test("successful responses pass through unchanged", async () => {
      const response = await request(server).get("/success");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    test("an invalid operational status cannot expose an error as success", async () => {
      const response = await request(server).get("/invalid-status");
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: "error",
        message: "Something went wrong!",
      });
    });

    test.each(["get", "post", "head"])(
      "unregistered %s returns 404 without reflecting the URL or query",
      async (method) => {
        const response = await request(server)[method](
          "/missing?tracking=fixture-value",
        );
        expect(response.status).toBe(404);
        expect(response.headers["content-type"]).toMatch(/application\/json/);
        if (method === "head") expect(response.text || "").toBe("");
        else {
          expect(response.body).toEqual({
            status: "fail",
            message: "Route not found.",
          });
        }
      },
    );
  },
);

test("an error after headers were sent is delegated without another response", () => {
  const error = new Error("already sent fixture");
  const response = { headersSent: true, status: jest.fn(), json: jest.fn() };
  const next = jest.fn();
  errorHandler(error, {}, response, next);
  expect(next).toHaveBeenCalledWith(error);
  expect(response.status).not.toHaveBeenCalled();
  expect(response.json).not.toHaveBeenCalled();
});

test("a logging failure cannot escape the generic response boundary", () => {
  const log = jest.spyOn(logger, "error").mockImplementation(() => {
    throw new Error("logging fixture failure");
  });
  try {
    const response = { headersSent: false, json: jest.fn() };
    response.status = jest.fn().mockReturnValue(response);
    const next = jest.fn();
    errorHandler(new Error("internal diagnostic fixture"), {}, response, next);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      status: "error",
      message: "Something went wrong!",
    });
    expect(next).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
