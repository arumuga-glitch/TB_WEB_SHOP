import CryptoJS from "crypto-js";

const SECRET = process.env.NEXT_PUBLIC_SECRET;

if (!SECRET) {
  throw new Error("NEXT_PUBLIC_SECRET is not defined");
}

export const encrypt = (value: string): string => {
  return CryptoJS.AES.encrypt(value, SECRET).toString();
};

export const decrypt = (cipher: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
};
