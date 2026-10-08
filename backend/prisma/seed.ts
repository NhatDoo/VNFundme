import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = process.env.SEED_ORGANIZER_EMAIL ?? "organizer@vnfundme.com";
  const password = process.env.SEED_ORGANIZER_PASSWORD ?? "Organizer@123";
  const name = process.env.SEED_ORGANIZER_NAME ?? "Organizer";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Organizer with email ${email} already exists.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phonenumber: "0900000000",
      password: hashedPassword,
      role: "ORGANIZER",
      status: "ACTIVE",
    },
  });

  console.log(`Created organizer account:`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });