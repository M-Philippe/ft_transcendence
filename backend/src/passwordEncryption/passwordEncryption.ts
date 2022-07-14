import { createCipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

export interface password {
  encryptedPassword: Buffer,
  randomIv: Buffer,
}

/*
**  Convert Json-based Object like:
**    data: [int, int, int]
**    type: "Buffer"
**  into a Buffer containing data array
*/
function convertJsonObjectToBuffer(objectToConvert: Object) {
  let transitionObject = JSON.parse(JSON.stringify(objectToConvert));
  return (Buffer.from(transitionObject["data"]));
}

export async function comparePassword(username: string, encryptedPassword: password | undefined, tryPassword: string) {
  if (encryptedPassword === undefined)
    return false;
  const tryEncryptedPassword = await encryptPassword(username, encryptedPassword.randomIv , tryPassword);
  let encryptedPasswordAsBuffer = convertJsonObjectToBuffer(encryptedPassword.encryptedPassword);
  return (encryptedPasswordAsBuffer.equals(tryEncryptedPassword));
}

export async function encryptPassword(username: string, randomIv: Buffer, tryPassword: string) {
  const iv = convertJsonObjectToBuffer(randomIv);
  const key = (await promisify(scrypt)(tryPassword, username + process.env.SEED_SALT, 32)) as Buffer;
  const cipher = createCipheriv("aes-256-ctr", key, iv);
  const encryptedText = Buffer.concat([
    cipher.update(tryPassword),
    cipher.final(),
  ]);
  return (encryptedText);
}

export async function encryptPasswordToStoreInDb(username: string, passwordObject: password | undefined, password: string) {
	const iv = randomBytes(16);
  const key = (await promisify(scrypt)(password, username + process.env.SEED_SALT, 32)) as Buffer;
  const cipher = createCipheriv("aes-256-ctr", key, iv);

  const encryptedText = Buffer.concat([
    cipher.update(password),
    cipher.final(),
  ]);
  passwordObject = {
    encryptedPassword: encryptedText,
    randomIv: iv,
  };
  return (passwordObject);
}
