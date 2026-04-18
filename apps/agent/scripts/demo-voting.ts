import { createApp } from "../src/photon/app.js";
import { proposeVote, recordVote, tallyVotes, parseVote, closeProposal } from "../src/photon/voting.js";
import { overrideMemberPhones } from "../src/state/mock-store.js";

async function main() {
  const phones = process.argv.slice(2);
  if (phones.length < 2) {
    console.log("Usage: npx tsx scripts/demo-voting.ts +15551110001 +15551110002 [+15551110003]");
    process.exit(1);
  }

  overrideMemberPhones("isl_demo", phones);

  const app = await createApp();
  const proposalId = "prop_demo_1";
  await proposeVote(app, "isl_demo", proposalId, "Build a library?");
  console.log("Vote proposal sent.");

  const fakeReplies: [string, string][] = [
    ["u_alex", "yes"],
    ["u_sam",  "Nope"],
    ["u_jess", "y"],
  ];

  for (const [userId, reply] of fakeReplies) {
    const v = parseVote(reply);
    if (v) {
      recordVote(proposalId, userId, v);
      console.log(`  ${userId} -> ${v}`);
    }
  }

  closeProposal(proposalId);
  console.log("Tally:", tallyVotes(proposalId));

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
