import CryptoJS from "crypto-js";

// Use a fallback for build-time or if env is missing to prevent total crash
// In production, this MUST be set in environment variables.
const SECRET = process.env.NEXT_PUBLIC_SECRET || "fallback-secret-rotation-required-123";

if (!process.env.NEXT_PUBLIC_SECRET && process.env.NODE_ENV === 'production') {
  console.error("❌ CRITICAL: NEXT_PUBLIC_SECRET is not defined in production environment!");
}

export const encrypt = (value: string): string => {
  if (!value) return "";
  try {
    return CryptoJS.AES.encrypt(value, SECRET).toString();
  } catch (err) {
    console.error("Encryption failed:", err);
    return "";
  }
};

export const decrypt = (cipher: string): string => {
  if (!cipher) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || "";
  } catch (err) {
    console.warn("Decryption failed - data might be tampered or secret changed.");
    return "";
  }
};
