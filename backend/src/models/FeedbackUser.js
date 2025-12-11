import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const FeedbackUser = sequelize.define("FeedbackUser", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false },
  role: { type: DataTypes.ENUM("user", "admin"), allowNull: false, defaultValue: "user" },
}, {
  tableName: "users", // same table as your main User
  timestamps: false,
});

export default FeedbackUser;
