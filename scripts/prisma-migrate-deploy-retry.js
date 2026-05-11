const { spawnSync } = require("node:child_process");

const maxAttempts = Number(process.env.PRISMA_MIGRATE_DEPLOY_ATTEMPTS || 5);
const delayMs = Number(process.env.PRISMA_MIGRATE_DEPLOY_RETRY_MS || 5000);

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  console.log(`Running prisma migrate deploy (${attempt}/${maxAttempts})...`);
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status === 0) {
    process.exit(0);
  }

  if (attempt < maxAttempts) {
    console.warn(`prisma migrate deploy failed. Retrying in ${delayMs}ms...`);
    sleep(delayMs);
  } else {
    process.exit(result.status || 1);
  }
}
