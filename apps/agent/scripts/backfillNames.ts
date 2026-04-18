import { ConvexHttpClient } from "convex/browser";
import "dotenv/config";

const CONVEX_URL = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;
if (!CONVEX_URL) throw new Error("Missing CONVEX_URL");

// We enforce the URL ends without a slash or it may have issues
const convex = new ConvexHttpClient(CONVEX_URL.replace(/\/+$/, ""));

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
if (!CLERK_SECRET_KEY) {
  console.error("❌ Missing CLERK_SECRET_KEY environment variable.");
  console.error("\nTo get the actual names from Clerk to populate the agent UI, you need to provide the Clerk Secret Key.");
  console.error("1. Go to your Clerk dashboard (for coherent-scorpion-90.clerk.accounts.dev or similar).");
  console.error("2. Go to API Keys and copy the Secret Key (starts with sk_test_...).");
  console.error("3. Run this script again by running:\n");
  console.error("   CLERK_SECRET_KEY=sk_test_... npm run backfill\n");
  process.exit(1);
}

async function run() {
  console.log("Fetching users from Clerk OAuth...");
  
  // Basic pagination via limit. For hackathons, 100 is usually enough.
  const res = await fetch("https://api.clerk.dev/v1/users?limit=100", {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  });
  
  if (!res.ok) {
    throw new Error(`Clerk API error: ${res.status} ${await res.text()}`);
  }
  
  const users = await res.json();
  console.log(`Found ${users.length} users. Syncing to Convex...`);

  let count = 0;
  for (const user of users) {
    const email = user.email_addresses?.[0]?.email_address;
    const phone = user.phone_numbers?.[0]?.phone_number;
    
    const icloudEmail = user.unsafe_metadata?.icloudEmail;
    const actualEmail = icloudEmail ?? email;
    
    // Resolve name matching the frontend logic
    const displayName = 
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || 
      user.username || 
      '';

    if (!displayName || (!actualEmail && !phone)) {
      console.log(`  Skipping user ${user.id} - missing name or contact info`);
      continue;
    }

    try {
      await convex.mutation("users:upsertProfile" as any, {
        phoneNumber: phone || undefined,
        email: actualEmail || undefined,
        displayName: displayName,
      });
      console.log(`  ✅ Synced: ${displayName}`);
      count++;
    } catch (e: any) {
      console.error(`  ❌ Failed to sync ${displayName}:`, e.message);
    }
  }
  
  console.log(`\n🎉 Done! Successfully synchronized ${count} profiles from Clerk.`);
}

run().catch(console.error);
