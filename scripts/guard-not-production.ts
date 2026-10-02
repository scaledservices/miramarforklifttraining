// Import FIRST in any script that creates known-password accounts or wipes
// data (demo-seed, seed-test-accounts). Refuses to run against production.
//
// `railway run --environment production ...` injects RAILWAY_ENVIRONMENT_NAME
// (and the service's AUTHORIZE_ENVIRONMENT), so a mistaken run against the
// live database stops here, before any DB connection is opened.
// Override only for a deliberate, approved one-off: I_UNDERSTAND_THIS_IS_PRODUCTION=yes
const markers = [
  process.env.RAILWAY_ENVIRONMENT_NAME === "production" && "RAILWAY_ENVIRONMENT_NAME=production",
  process.env.RAILWAY_ENVIRONMENT === "production" && "RAILWAY_ENVIRONMENT=production",
  process.env.AUTHORIZE_ENVIRONMENT === "production" && "AUTHORIZE_ENVIRONMENT=production",
].filter(Boolean);

if (markers.length && process.env.I_UNDERSTAND_THIS_IS_PRODUCTION !== "yes") {
  console.error(`FATAL: refusing to run ${process.argv[1] ?? "this script"} against production (${markers.join(", ")}).`);
  console.error("It creates known-password test accounts and/or wipes data.");
  process.exit(1);
}

export {};
