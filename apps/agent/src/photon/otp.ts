import { sendDM, makeIdempotencyKey, type SpectrumApp } from "./send.js";

const OTP_TTL_MS = 5 * 60 * 1000;

type OtpRecord = { code: string; issuedAt: number };
const otpStore = new Map<string, OtpRecord>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(app: SpectrumApp, phone: string): Promise<string> {
  const code = generateOtp();
  otpStore.set(phone, { code, issuedAt: Date.now() });

  const body = `Isla here. Your code is ${code}. Expires in 5 minutes.`;
  const key = makeIdempotencyKey(["otp", phone, code]);
  await sendDM(app, phone, body, key);
  return code;
}

export function verifyOtp(phone: string, code: string): boolean {
  const record = otpStore.get(phone);
  if (!record) return false;
  if (Date.now() - record.issuedAt > OTP_TTL_MS) {
    otpStore.delete(phone);
    return false;
  }
  if (record.code !== code.trim()) return false;
  otpStore.delete(phone);
  return true;
}
