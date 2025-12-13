import { Sequelize } from "sequelize";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in environment variables");
  throw new Error(
    "DATABASE_URL is not defined! Make sure it's set in Railway environment variables."
  );
}

console.log("ℹ️ Initializing database connection...");

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "mysql",
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { 
      require: true,
      rejectUnauthorized: false 
    } : {}
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3,
    timeout: 30000
  }
});

export const testConnection = async () => {
  try {
    console.log("🔍 Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Connected to MySQL successfully!");
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log("✅ Database query test successful:", results);
    
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.parent?.code);
    console.error("Error SQL:", error.parent?.sql);
    
    return false;
  }
};

// Handle connection events
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
  });

export default sequelize;
