import { Sequelize } from "sequelize";
import mysql2 from "mysql2/promise"; // Use the promise API explicitly (pure JS)

const DATABASE_URL = process.env.DATABASE_URL;

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "mysql",
  dialectModule: mysql2, // <-- forces pure JS (avoids native binaries)
  logging: false,
  dialectOptions: process.env.NODE_ENV === "production"
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
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
