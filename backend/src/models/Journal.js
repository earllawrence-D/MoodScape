import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Journal extends Model {}

Journal.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: { type: DataTypes.INTEGER, allowNull: false },

    content: { type: DataTypes.TEXT("long"), allowNull: false },

    isVoice: { type: DataTypes.BOOLEAN, defaultValue: false },

    mood: { type: DataTypes.STRING(50), defaultValue: "neutral" },

    moodScore: { type: DataTypes.FLOAT, defaultValue: 5 },

    aiReport: { type: DataTypes.TEXT("long"), allowNull: true },

    aiResponse: { type: DataTypes.TEXT("long"), allowNull: true },

    // 🆕 Therapist assigned ID
    assignedTherapistId: { type: DataTypes.INTEGER, allowNull: true },

    // 🆕 Crisis + Harmful detection fields
    containsHarmful: { type: DataTypes.BOOLEAN, defaultValue: false },
    harmfulWords: { 
      type: DataTypes.TEXT, 
      allowNull: true,
      get() {
        const value = this.getDataValue('harmfulWords');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('harmfulWords', value ? JSON.stringify(value) : '[]');
      }
    },

    // Legacy field you already have
    isCrisis: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: "Journal",
    tableName: "journal_entries",
    timestamps: true,
  }
);

export default Journal;
