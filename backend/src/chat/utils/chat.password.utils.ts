import { isNotEmptyObject } from "class-validator";
import { password } from "src/passwordEncryption/passwordEncryption";


export function isPasswordEmpty(password: password | undefined) {
  if (password === undefined || password === null)
    return true;
  if (password.encryptedPassword === undefined)
    return true;
  if (password.encryptedPassword.length != 2)
    return false;
  if (isNotEmptyObject(password))
    return false;
  return true;
}
