const { randomUUID } = require("crypto");

const revokedAccessTokens = new Map();
const validRefreshTokens = new Map();

const nowSeconds = () => Math.floor(Date.now() / 1000);

const cleanupExpiredTokens = () => {
  const now = nowSeconds();

  for (const [jti, exp] of revokedAccessTokens.entries()) {
    if (exp <= now) {
      revokedAccessTokens.delete(jti);
    }
  }

  for (const [jti, data] of validRefreshTokens.entries()) {
    if (data.exp <= now) {
      validRefreshTokens.delete(jti);
    }
  }
};

setInterval(cleanupExpiredTokens, 60 * 1000).unref();

const createJti = () => randomUUID();

const revokeAccessToken = ({ jti, exp }) => {
  if (!jti || !exp) {
    return;
  }
  revokedAccessTokens.set(jti, exp);
};

const isAccessTokenRevoked = (jti) => {
  if (!jti) {
    return false;
  }
  return revokedAccessTokens.has(jti);
};

const storeRefreshToken = ({ jti, userId, exp }) => {
  if (!jti || !userId || !exp) {
    return;
  }

  validRefreshTokens.set(jti, {
    userId,
    exp,
  });
};

const consumeRefreshToken = ({ jti, userId }) => {
  const data = validRefreshTokens.get(jti);
  if (!data) {
    return false;
  }

  if (String(data.userId) !== String(userId)) {
    return false;
  }

  validRefreshTokens.delete(jti);
  return true;
};

const revokeRefreshToken = (jti) => {
  if (!jti) {
    return;
  }
  validRefreshTokens.delete(jti);
};

module.exports = {
  createJti,
  revokeAccessToken,
  isAccessTokenRevoked,
  storeRefreshToken,
  consumeRefreshToken,
  revokeRefreshToken,
};
