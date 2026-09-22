import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { seedDemoData } from "../src/lib/demo-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin user "${admin.username}" (${admin.email}).`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`Default password: ${password} - change this after first login.`);
  }

  await prisma.setting.upsert({
    where: { key: "branding" },
    update: {},
    create: {
      key: "branding",
      value: { companyName: "Outwork CRM", primaryColor: "#5e72e4" },
    },
  });

  await prisma.setting.upsert({
    where: { key: "pipelineLabels" },
    update: {},
    create: {
      key: "pipelineLabels",
      value: {
        clientStages: {
          INTERESTED: "Interested",
          CANDIDATE_MATCHED: "Candidate Matched",
          CONTRACT_SIGNED: "Contract Signed",
          TRIAL_PASSED: "Trial Passed",
          LOST: "Lost",
        },
        candidateStages: {
          SOURCED: "Sourced",
          SUITABLE: "Suitable",
          MATCHED: "Matched",
          ACCEPTED: "Accepted",
          REJECTED: "Rejected",
        },
      },
    },
  });

  const result = await seedDemoData(prisma, admin.id);
  console.log(
    result.skipped
      ? "Demo data already present, skipping."
      : "Seeded demo data: 5 clients, 5 candidates, 2 unconverted contacts, 4 jobs, 5 matches, 5 activity notes, 2 meetings, 2 emails."
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
