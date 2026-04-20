import "dotenv/config";
import { execSync } from "child_process";
import app from "./app";
import { prisma } from "./config/prisma";

const PORT = parseInt(process.env["PORT"] ?? "3000", 10);

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("⚠️  Migration warning (continuing anyway):", error);
    // Don't exit — server can still start even if migrations fail
  }
}

async function bootstrap() {
  try {
    // Run migrations before starting
    await runMigrations();

    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env["NODE_ENV"]}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("✅ Database disconnected");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
