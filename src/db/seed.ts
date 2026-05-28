import { db } from "./index";
import { users, buildings, rooms, expenseCategories } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Seed Admin User
  const passwordHash = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    id: crypto.randomUUID(),
    username: "admin",
    passwordHash: passwordHash,
    role: "ADMIN",
  });
  console.log("Admin user created: admin / admin123");

  // Seed Buildings
  const buildingA_Id = crypto.randomUUID();
  const buildingC_Id = crypto.randomUUID();
  const buildingD_Id = crypto.randomUUID();

  await db.insert(buildings).values([
    { id: buildingA_Id, name: "Bangunan A" },
    { id: buildingC_Id, name: "Bangunan C" },
    { id: buildingD_Id, name: "Bangunan D" },
  ]);
  console.log("Buildings created.");

  // Seed Rooms
  await db.insert(rooms).values([
    { id: crypto.randomUUID(), buildingId: buildingA_Id, name: "Ruang Kelas 1" },
    { id: crypto.randomUUID(), buildingId: buildingA_Id, name: "Ruang Kelas 2" },
    { id: crypto.randomUUID(), buildingId: buildingC_Id, name: "Ruang Kelas 5" },
    { id: crypto.randomUUID(), buildingId: buildingC_Id, name: "Ruang Kelas 6" },
    { id: crypto.randomUUID(), buildingId: buildingD_Id, name: "RKB 1" },
    { id: crypto.randomUUID(), buildingId: buildingD_Id, name: "RKB 2" },
    { id: crypto.randomUUID(), buildingId: buildingD_Id, name: "RKB 3" },
  ]);
  console.log("Rooms created.");

  // Seed Expense Categories
  await db.insert(expenseCategories).values([
    { id: crypto.randomUUID(), name: "Material" },
    { id: crypto.randomUUID(), name: "Upah Tukang" },
    { id: crypto.randomUUID(), name: "Cat" },
    { id: crypto.randomUUID(), name: "Keramik" },
    { id: crypto.randomUUID(), name: "Kayu" },
    { id: crypto.randomUUID(), name: "Transportasi" },
  ]);
  console.log("Expense categories created.");

  console.log("Seeding complete!");
}

seed().catch((e) => {
  console.error("Seeding failed", e);
  process.exit(1);
});
