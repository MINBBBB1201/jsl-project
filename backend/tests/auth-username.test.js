const express = require("express");
const request = require("supertest");
const db = require("./helpers/db");
const User = require("../src/models/user.model");
const routes = require("../src/routes/auth.routes");
const { signToken } = require("../src/utils/jwt");
const { setAccountLogin } = require("../src/scripts/set-account-login");
const app = express();
app.use(express.json());
app.use("/api/auth", routes);
const password = "FixtureOnly-Password-47";
beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.disconnect());
const user = (extra = {}) =>
  User.create({
    email: "fixture@example.test",
    name: "Fixture",
    password,
    ...extra,
  });
const login = (email, secret = password) =>
  request(app).post("/api/auth/login").send({ email, password: secret });

test("missing username index blocks registration and setup before any write", async () => {
  const admin = await user({ role: "admin" });
  const indexes = await User.collection.indexes();
  await User.collection.dropIndex(
    indexes.find((index) => index.key.username === 1).name,
  );
  try {
    const res = await request(app)
      .post("/api/auth/register")
      .set({ Authorization: `Bearer ${signToken(admin)}` })
      .send({
        email: "blocked@example.test",
        username: "Blocked_User",
        password,
        name: "Fixture",
      });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("USERNAME_NOT_READY");
    await expect(
      setAccountLogin({
        email: admin.email,
        username: "Blocked_User",
        password,
      }),
    ).rejects.toThrow("USERNAME_INDEX_NOT_READY");
    expect(await User.countDocuments()).toBe(1);
  } finally {
    await User.createIndexes();
  }
});

test("legacy email-only accounts remain valid", async () => {
  await user();
  const res = await login("fixture@example.test");
  expect(res.status).toBe(200);
  expect(res.body.data.user.username).toBeUndefined();
  expect(res.body.data.user.password).toBeUndefined();
});
test("username is normalized and both identities authenticate the same account", async () => {
  const saved = await user({ username: "Fixture_User" });
  const byUsername = await login("  FIXTURE_USER  ");
  const byEmail = await login("fixture@example.test");
  expect(byUsername.status).toBe(200);
  expect(byEmail.body.data.user.id).toBe(saved.id);
  expect(byUsername.body.data.user).toMatchObject({
    id: saved.id,
    username: "fixture_user",
  });
});
test("username index rejects case-insensitive duplicates and allows multiple legacy accounts", async () => {
  await user({ username: "Fixture_User" });
  await expect(
    user({ email: "other@example.test", username: "FIXTURE_USER" }),
  ).rejects.toMatchObject({ code: 11000 });
  await user({ email: "legacy1@example.test" });
  await user({ email: "legacy2@example.test" });
});
test("unknown username, wrong password and inactive account keep the same rejection", async () => {
  await user({ username: "fixture_user", isActive: false });
  const inactive = await login("fixture_user");
  const absent = await login("absent_user");
  const wrong = await login("fixture_user", "incorrect");
  for (const res of [inactive, absent, wrong]) expect(res.status).toBe(401);
  expect(inactive.body).toEqual(absent.body);
  expect(wrong.body).toEqual(absent.body);
});
test.each(["ab", "bad name", "bad@", { username: "fixture_user" }, null])(
  "invalid identifier is rejected before lookup: %p",
  async (identity) => {
    expect((await login(identity)).status).toBe(400);
  },
);
test("only admins issue usernames and duplicate registration returns 409", async () => {
  const admin = await user({ role: "admin" });
  const body = {
    email: "new@example.test",
    username: "New_User",
    name: "New fixture",
    password,
  };
  expect(
    (await request(app).post("/api/auth/register").send(body)).status,
  ).toBe(403);
  const headers = { Authorization: `Bearer ${signToken(admin)}` };
  const created = await request(app)
    .post("/api/auth/register")
    .set(headers)
    .send(body);
  expect(created.status).toBe(201);
  expect(created.body.data.user.username).toBe("new_user");
  const duplicate = await request(app)
    .post("/api/auth/register")
    .set(headers)
    .send({ ...body, email: "different@example.test", username: "NEW_USER" });
  expect(duplicate.status).toBe(409);
});

test("account setup changes only login fields and never creates missing accounts", async () => {
  const existing = await user({ role: "sales", isActive: false });
  await setAccountLogin({
    email: existing.email,
    username: "Updated_User",
    password,
  });
  const saved = await User.findById(existing.id).select("+password");
  expect(saved.username).toBe("updated_user");
  expect(saved.role).toBe("sales");
  expect(saved.isActive).toBe(false);
  expect(await saved.verifyPassword(password)).toBe(true);
  await expect(
    setAccountLogin({
      email: "missing@example.test",
      username: "Missing_User",
      password,
    }),
  ).rejects.toThrow("ACCOUNT_NOT_FOUND");
  expect(await User.countDocuments()).toBe(1);
});

test("duplicate username setup is atomic and preserves the original password", async () => {
  await user({ username: "Taken_User" });
  const existing = await user({
    email: "other@example.test",
    username: "Original_User",
  });
  await expect(
    setAccountLogin({
      email: existing.email,
      username: "Taken_User",
      password: "Changed-Fixture-Only",
    }),
  ).rejects.toMatchObject({ code: 11000 });
  const saved = await User.findById(existing.id).select("+password");
  expect(saved.username).toBe("original_user");
  expect(await saved.verifyPassword(password)).toBe(true);
});
