// Input is a JSON object on stdin. Never pass passwords as command arguments.
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { requireUsernameIndex } = require("../services/username-index");

async function setAccountLogin({ email, username, password }) {
  if (
    typeof email !== "string" ||
    !email.includes("@") ||
    typeof username !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,31}$/.test(username.trim()) ||
    typeof password !== "string" ||
    password.length < User.MIN_PASSWORD_LENGTH
  )
    throw new Error("INVALID_ACCOUNT_INPUT");
  const account = await User.findOne({ email: email.toLowerCase().trim() });
  if (!account) throw new Error("ACCOUNT_NOT_FOUND");
  await requireUsernameIndex();
  const hashed = await bcrypt.hash(password, 12);
  const updated = await User.findOneAndUpdate(
    { _id: account._id },
    { $set: { username: username.toLowerCase().trim(), password: hashed } },
    { new: true, runValidators: true },
  );
  if (!updated) throw new Error("ACCOUNT_NOT_FOUND");
  return { updated: true, active: updated.isActive };
}

if (require.main === module) {
  require("../config/dns");
  const { connectDB, closeDB } = require("../config/database");
  (async () => {
    try {
      const input = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
      await connectDB();
      console.log(JSON.stringify(await setAccountLogin(input)));
    } catch (error) {
      const allowed = [
        "INVALID_ACCOUNT_INPUT",
        "ACCOUNT_NOT_FOUND",
        "USERNAME_INDEX_NOT_READY",
      ];
      const code =
        error.code === 11000
          ? "DUPLICATE_USERNAME"
          : allowed.includes(error.message)
            ? error.message
            : "ACCOUNT_UPDATE_FAILED";
      console.error(code);
      process.exitCode = 1;
    } finally {
      await closeDB();
    }
  })();
}
module.exports = { setAccountLogin };
