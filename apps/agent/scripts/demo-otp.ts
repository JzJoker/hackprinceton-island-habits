import { createApp } from "../src/photon/app.js";
import { sendOtp, verifyOtp } from "../src/photon/otp.js";

async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.log("Usage: npx tsx scripts/demo-otp.ts +15551234567");
    process.exit(1);
  }

  const app = await createApp();
  const code = await sendOtp(app, phone);
  console.log(`Sent OTP ${code} to ${phone}.`);

  console.log(`verifyOtp(${phone}, "${code}") = ${verifyOtp(phone, code)}`);
  console.log(`verifyOtp(${phone}, "000000") = ${verifyOtp(phone, "000000")}`);

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
