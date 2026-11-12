const User = require("../models/user.model");
async function requireUsernameIndex() {
  const indexes = await User.collection.indexes();
  if (
    !indexes.some(
      (index) =>
        index.unique === true &&
        index.key.username === 1 &&
        Object.keys(index.key).length === 1 &&
        index.partialFilterExpression?.username?.$type === "string",
    )
  ) {
    throw new Error("USERNAME_INDEX_NOT_READY");
  }
}
module.exports = { requireUsernameIndex };
