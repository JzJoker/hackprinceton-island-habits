import { createApp } from "../src/photon/app.js";
import { proposeAscension, executeAscension } from "../src/photon/ascension.js";
import { recordVote, closeProposal } from "../src/photon/voting.js";
import { overrideMemberPhones, setIslandLevel } from "../src/state/mock-store.js";

async function main() {
  const phones = process.argv.slice(2);
  if (phones.length < 2) {
    console.log("Usage: npx tsx scripts/demo-ascension.ts +15551110001 +15551110002 [+15551110003]");
    process.exit(1);
  }

  overrideMemberPhones("isl_demo", phones);
  setIslandLevel("isl_demo", 10);

  const app = await createApp();
  const proposalId = "prop_ascend_1";

  const proposed = await proposeAscension(app, "isl_demo", proposalId);
  console.log(`Ascension proposal: ${proposed ? "sent" : "skipped"}`);

  recordVote(proposalId, "u_alex", "yes");
  recordVote(proposalId, "u_sam",  "yes");
  recordVote(proposalId, "u_jess", "no");
  closeProposal(proposalId);

  const executed = await executeAscension(app, "isl_demo", proposalId, 47, 312);
  console.log(`Ascension narrative: ${executed ? "sent" : "skipped"}`);

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
