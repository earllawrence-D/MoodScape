import { Sequelize } from "sequelize";
import mysql2 from "mysql2/promise"; // <- pure JS

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  dialectModule: mysql2, // <- forces pure JS mode
  logging: false,
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
