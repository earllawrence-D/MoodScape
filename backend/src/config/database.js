import { Sequelize } from "sequelize";

// Use the full Railway MySQL URL
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "mysql://root:yOmWwLqjSXpEHfWzDaKcUOslfQgYXAEi@mysql.railway.internal:3306/railway";

// Detect production
const isProduction = process.env.NODE_ENV === "production";

// Initialize Sequelize
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "mysql",
  logging: false,
  dialectOptions: isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
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
