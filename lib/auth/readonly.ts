import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 hours

type StorePasswordMap = Record<string, string>;

function getReadonlySecret() {
  const secret = process.env.READONLY_TIMESHEET_SECRET || process.env.READONLY_TIMESHEET_PASSWORD;
  if (!secret) {
    throw new Error('Missing READONLY_TIMESHEET_SECRET or READONLY_TIMESHEET_PASSWORD');
  }

  return secret;
}

function sign(value: string) {
  return createHmac('sha256', getReadonlySecret()).update(value).digest('hex');
}

function normalizeStoreKey(value: string) {
  return value.trim().toLowerCase();
}

function getStorePasswordMap(): StorePasswordMap {
  const raw = process.env.READONLY_STORE_PASSWORDS_JSON;
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as StorePasswordMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new Error('Invalid READONLY_STORE_PASSWORDS_JSON format');
  }
}

export function verifyReadonlyPassword(password: string) {
  const expected = process.env.READONLY_TIMESHEET_PASSWORD;
  if (!expected) {
    throw new Error('Missing READONLY_TIMESHEET_PASSWORD');
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(password);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function verifyReadonlyPasswordForStore(storeId: string, storeName: string, password: string) {
  const storeMap = getStorePasswordMap();
  const byStoreId = storeMap[storeId];

  const storeNameKey = Object.keys(storeMap).find(
    (key) => normalizeStoreKey(key) === normalizeStoreKey(storeName)
  );
  const byStoreName = storeNameKey ? storeMap[storeNameKey] : undefined;
  const expected = byStoreId || byStoreName;

  // Backward compatibility fallback: single shared password.
  if (!expected) {
    return verifyReadonlyPassword(password);
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(password);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function createReadonlySessionToken(storeId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = `${storeId}.${expiresAt}`;
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function parseReadonlySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [storeId, expiresAtRaw, signature] = token.split('.');

  if (!storeId || !expiresAtRaw || !signature) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const payload = `${storeId}.${expiresAtRaw}`;
  const expectedSignature = sign(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  return { storeId, expiresAt };
}

export function isValidReadonlySessionToken(token: string | undefined) {
  return Boolean(parseReadonlySessionToken(token));
}
