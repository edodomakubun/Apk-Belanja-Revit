import { db } from "./index";
import { schools, users, buildings, rooms, expenseCategories } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database (Multi-School Version)...");

  // Seed School
  const school1_Id = crypto.randomUUID();
  await db.insert(schools).values({
    id: school1_Id,
    name: "SDN 1 Contoh",
    address: "Jl. Pendidikan No. 1",
  });
  console.log("School created.");

  // Seed Admin User
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    id: crypto.randomUUID(),
    schoolId: school1_Id,
    username: "admin",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
  });
  console.log("Admin user created: admin / admin123");

  // Seed Bendahara User
  const bendaharaPasswordHash = await bcrypt.hash("bendahara123", 10);
  await db.insert(users).values({
    id: crypto.randomUUID(),
    schoolId: school1_Id,
    username: "bendahara",
    passwordHash: bendaharaPasswordHash,
    role: "BENDAHARA",
  });
  console.log("Bendahara user created: bendahara / bendahara123");

  // Seed Buildings
  const buildingA_Id = crypto.randomUUID();
  const buildingC_Id = crypto.randomUUID();
  const buildingD_Id = crypto.randomUUID();

  await db.insert(buildings).values([
    { id: buildingA_Id, schoolId: school1_Id, name: "Bangunan A" },
    { id: buildingC_Id, schoolId: school1_Id, name: "Bangunan C" },
    { id: buildingD_Id, schoolId: school1_Id, name: "Bangunan D" },
  ]);
  console.log("Buildings created.");

  // Seed Rooms
  await db.insert(rooms).values([
    { id: crypto.randomUUID(), schoolId: school1_Id, buildingId: buildingA_Id, name: "Ruang Kelas 1" },
    { id: crypto.randomUUID(), schoolId: school1_Id, buildingId: buildingA_Id, name: "Ruang Kelas 2" },
    { id: crypto.randomUUID(), schoolId: school1_Id, buildingId: buildingC_Id, name: "Ruang Kelas 5" },
    { id: crypto.randomUUID(), schoolId: school1_Id, buildingId: buildingC_Id, name: "Ruang Kelas 6" },
    { id: crypto.randomUUID(), schoolId: school1_Id, buildingId: buildingD_Id, name: "RKB 1" },
    { id: crypto.randomUUID(), schoolId: school1_Id, buildingId: buildingD_Id, name: "RKB 2" },
    { id: crypto.randomUUID(), schoolId: school1_Id, buildingId: buildingD_Id, name: "RKB 3" },
  ]);
  console.log("Rooms created.");

  // Seed Expense Categories
  await db.insert(expenseCategories).values([
    { id: crypto.randomUUID(), schoolId: school1_Id, name: "Material" },
    { id: crypto.randomUUID(), schoolId: school1_Id, name: "Upah Tukang" },
    { id: crypto.randomUUID(), schoolId: school1_Id, name: "Cat" },
    { id: crypto.randomUUID(), schoolId: school1_Id, name: "Keramik" },
    { id: crypto.randomUUID(), schoolId: school1_Id, name: "Kayu" },
    { id: crypto.randomUUID(), schoolId: school1_Id, name: "Transportasi" },
  ]);
  console.log("Expense categories created.");

  console.log("Seeding complete!");
}

seed().catch((e) => {
  console.error("Seeding failed", e);
  process.exit(1);
});
