// models/Feedback.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const Feedback = sequelize.define("Feedback", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Associations
Feedback.belongsTo(User, { as: "user", foreignKey: "userId" });
User.hasMany(Feedback, { as: "feedbacks", foreignKey: "userId" });

export default Feedback;
