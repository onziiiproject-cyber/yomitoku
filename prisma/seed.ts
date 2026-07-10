import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const tags = [
  { key: "visiting",    label: "訪問系サービス",         sortOrder: 1 },
  { key: "daycare",     label: "通所・小規模多機能系",   sortOrder: 2 },
  { key: "facility",    label: "施設・入所系",           sortOrder: 3 },
  { key: "caremanager", label: "居宅介護支援・ケアマネ", sortOrder: 4 },
  { key: "equipment",   label: "福祉用具・住宅改修",     sortOrder: 5 },
  { key: "community",   label: "地域密着型サービス全般", sortOrder: 6 },
  { key: "revision",    label: "報酬改定・制度改正",     sortOrder: 7 },
  { key: "procedure",   label: "様式・手続き",           sortOrder: 8 },
  { key: "safety",      label: "安全・事故防止",         sortOrder: 9 },
  { key: "training",    label: "セミナー・研修案内",     sortOrder: 10 },
];

async function main() {
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { key: tag.key },
      update: { label: tag.label, sortOrder: tag.sortOrder },
      create: tag,
    });
  }
  console.log("Tags seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
