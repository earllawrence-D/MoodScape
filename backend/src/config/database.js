import { Sequelize } from "sequelize";
import mysql2 from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined!");
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "mysql",
  dialectModule: mysql2, // forces pure JS mode
  logging: false,
  dialectOptions: process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: false } } : {},
});

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to MySQL successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

export default sequelize;
