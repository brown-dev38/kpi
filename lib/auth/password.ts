import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

const deriveKey = (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
  });

  return [
    "scrypt",
    "v1",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
};

export const verifyPassword = async (password: string, encodedHash: string) => {
  const [algorithm, version, cost, blockSize, parallelization, salt, hash] =
    encodedHash.split("$");

  if (algorithm !== "scrypt" || version !== "v1" || !salt || !hash) {
    return false;
  }

  const storedHash = Buffer.from(hash, "base64");
  if (storedHash.length !== KEY_LENGTH) return false;

  try {
    const derivedKey = await deriveKey(
      password,
      Buffer.from(salt, "base64"),
      storedHash.length,
      {
        N: Number(cost),
        r: Number(blockSize),
        p: Number(parallelization),
      },
    );

    return timingSafeEqual(storedHash, derivedKey);
  } catch {
    return false;
  }
};
