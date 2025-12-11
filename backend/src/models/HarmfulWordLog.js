import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const HarmfulWordLog = sequelize.define(
  "HarmfulWordLog",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    journalEntryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    word: { type: DataTypes.STRING, allowNull: false },

    context: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "harmful_word_log",
    timestamps: true,
  }
);

export default HarmfulWordLog;
