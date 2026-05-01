import crypto from "crypto";

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [scheme, salt, storedKey] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !storedKey) return false;

  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const storedKeyBuffer = Buffer.from(storedKey, "hex");
  if (storedKeyBuffer.length !== derivedKey.length) return false;

  return crypto.timingSafeEqual(storedKeyBuffer, derivedKey);
}
