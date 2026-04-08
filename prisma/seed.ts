import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await hash("admin123", 12);
  const employeePassword = await hash("employee123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "管理者",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: "tanaka@example.com" },
    update: {},
    create: {
      email: "tanaka@example.com",
      name: "田中太郎",
      passwordHash: employeePassword,
      role: "EMPLOYEE",
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: "suzuki@example.com" },
    update: {},
    create: {
      email: "suzuki@example.com",
      name: "鈴木花子",
      passwordHash: employeePassword,
      role: "EMPLOYEE",
    },
  });

  const currentYear = new Date().getFullYear();

  for (const user of [admin, employee1, employee2]) {
    await prisma.leaveBalance.upsert({
      where: {
        userId_fiscalYear: { userId: user.id, fiscalYear: currentYear },
      },
      update: {},
      create: {
        userId: user.id,
        fiscalYear: currentYear,
        totalDays: 20,
        usedDays: 0,
      },
    });
  }

  console.log("Seed data created:");
  console.log("  Admin: admin@example.com / admin123");
  console.log("  Employee: tanaka@example.com / employee123");
  console.log("  Employee: suzuki@example.com / employee123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
