/*
  Danger: This script deletes lists from the database.

  Usage:
    DATABASE_URL="postgres://..." node scripts/reset-lists.js              # delete ALL lists
    DATABASE_URL="postgres://..." node scripts/reset-lists.js --user <id>   # delete lists for a single userId

  Notes:
  - Requires @prisma/client to be generated (npm install && prisma generate)
  - DATABASE_URL must point to the target database
*/

/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const userFlagIndex = args.indexOf("--user");
  const userId = userFlagIndex >= 0 ? args[userFlagIndex + 1] : null;

  if (userFlagIndex >= 0 && !userId) {
    console.error("--user flag provided but no userId specified");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required in the environment");
    process.exit(1);
  }

  console.log("Connecting to DB...\n");

  try {
    if (userId) {
      console.log(`Deleting lists for userId: ${userId} ...`);
      // Due to FK cascades, deleting lists will delete items and progress
      const res = await prisma.list.deleteMany({ where: { userId } });
      console.log(`Deleted ${res.count} lists for user ${userId}.`);
    } else {
      console.log("Deleting ALL lists (and associated items/progress via cascade)...");
      // In case cascades aren't present in a given env, delete children first
      await prisma.progress.deleteMany({});
      await prisma.item.deleteMany({});
      const res = await prisma.list.deleteMany({});
      console.log(`Deleted ${res.count} lists.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
