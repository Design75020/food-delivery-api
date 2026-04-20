import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.orderStatusLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const SALT = 12;

  // ─── Users ──────────────────────────────────

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@fooddelivery.com",
      password: await bcrypt.hash("Admin123!", SALT),
      name: "Super Admin",
      role: Role.ADMIN,
    },
  });

  const restaurantUser = await prisma.user.create({
    data: {
      email: "owner@pizzapalace.com",
      password: await bcrypt.hash("Owner123!", SALT),
      name: "Mario Rossi",
      role: Role.RESTAURANT,
    },
  });

  const restaurantUser2 = await prisma.user.create({
    data: {
      email: "owner@burgerking.com",
      password: await bcrypt.hash("Owner123!", SALT),
      name: "Jean Dupont",
      role: Role.RESTAURANT,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: "client@example.com",
      password: await bcrypt.hash("Client123!", SALT),
      name: "Alice Martin",
      role: Role.CLIENT,
    },
  });

  const courierUser = await prisma.user.create({
    data: {
      email: "courier@example.com",
      password: await bcrypt.hash("Courier123!", SALT),
      name: "Bob Dupont",
      role: Role.COURIER,
    },
  });

  console.log("✅ Users created");

  // ─── Restaurants ────────────────────────────

  const restaurant1 = await prisma.restaurant.create({
    data: {
      name: "Pizza Palace",
      description: "Authentic Italian pizzas made with fresh ingredients",
      address: "12 Rue de la Paix, Paris 75001",
      phone: "+33 1 23 45 67 89",
      isOpen: true,
      ownerId: restaurantUser.id,
    },
  });

  const restaurant2 = await prisma.restaurant.create({
    data: {
      name: "Burger Kingdom",
      description: "Gourmet burgers and crispy fries",
      address: "45 Avenue des Champs-Élysées, Paris 75008",
      phone: "+33 1 98 76 54 32",
      isOpen: true,
      ownerId: restaurantUser2.id,
    },
  });

  console.log("✅ Restaurants created");

  // ─── Menu Items ─────────────────────────────

  await prisma.menuItem.createMany({
    data: [
      {
        name: "Margherita Pizza",
        description: "Classic tomato sauce, mozzarella, fresh basil",
        price: 12.5,
        category: "Pizza",
        isAvailable: true,
        restaurantId: restaurant1.id,
      },
      {
        name: "Quattro Formaggi",
        description: "Four cheese blend on crispy dough",
        price: 14.9,
        category: "Pizza",
        isAvailable: true,
        restaurantId: restaurant1.id,
      },
      {
        name: "Tiramisu",
        description: "Traditional Italian dessert",
        price: 6.5,
        category: "Dessert",
        isAvailable: true,
        restaurantId: restaurant1.id,
      },
      {
        name: "Classic Burger",
        description: "Beef patty, lettuce, tomato, pickles, special sauce",
        price: 11.0,
        category: "Burger",
        isAvailable: true,
        restaurantId: restaurant2.id,
      },
      {
        name: "Double Smash Burger",
        description: "Double smashed patty, cheddar, caramelized onions",
        price: 15.5,
        category: "Burger",
        isAvailable: true,
        restaurantId: restaurant2.id,
      },
      {
        name: "Crispy Fries",
        description: "Golden crispy fries with sea salt",
        price: 4.5,
        category: "Sides",
        isAvailable: true,
        restaurantId: restaurant2.id,
      },
    ],
  });

  console.log("✅ Menu items created");

  // ─── Courier Profile ────────────────────────

  await prisma.courier.create({
    data: {
      userId: courierUser.id,
      vehicleType: "bicycle",
      isAvailable: true,
      latitude: 48.8566,
      longitude: 2.3522,
    },
  });

  console.log("✅ Courier profile created");

  // ─── Summary ────────────────────────────────

  console.log("\n🎉 Seed completed successfully!\n");
  console.log("📋 Test Credentials:");
  console.log("─────────────────────────────────────────────");
  console.log(`👑 Admin:      admin@fooddelivery.com   / Admin123!`);
  console.log(`🍕 Restaurant: owner@pizzapalace.com    / Owner123!`);
  console.log(`🍔 Restaurant: owner@burgerking.com     / Owner123!`);
  console.log(`👤 Client:     client@example.com       / Client123!`);
  console.log(`🚴 Courier:    courier@example.com      / Courier123!`);
  console.log("─────────────────────────────────────────────");
  console.log(`\n🆔 Restaurant IDs:`);
  console.log(`   Pizza Palace:    ${restaurant1.id}`);
  console.log(`   Burger Kingdom:  ${restaurant2.id}`);
  console.log(`\n👤 User IDs:`);
  console.log(`   Admin:    ${adminUser.id}`);
  console.log(`   Client:   ${clientUser.id}`);
  console.log(`   Courier:  ${courierUser.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
