import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Journal extends Model {}

Journal.init(
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true,
      field: 'id' // Explicitly set the column name
    },

    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      field: 'user_id' // Map to user_id column in the database
    },

    content: { 
      type: DataTypes.TEXT("long"), 
      allowNull: false,
      field: 'content'
    },

    isVoice: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
      field: 'is_voice'
    },

    mood: { 
      type: DataTypes.STRING(50), 
      defaultValue: "neutral",
      field: 'mood'
    },

    moodScore: { 
      type: DataTypes.FLOAT, 
      defaultValue: 5,
      field: 'mood_score'
    },

    aiReport: { 
      type: DataTypes.TEXT("long"), 
      allowNull: true,
      field: 'ai_report'
    },

    aiResponse: { 
      type: DataTypes.TEXT("long"), 
      allowNull: true,
      field: 'ai_response'
    },

    // Therapist assigned ID
    assignedTherapistId: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      field: 'assigned_therapist_id'
    },

    // Crisis + Harmful detection fields
    containsHarmful: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
      field: 'contains_harmful'
    },
    
    harmfulWords: { 
      type: DataTypes.TEXT, 
      allowNull: true,
      field: 'harmful_words',
      get() {
        const value = this.getDataValue('harmfulWords');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('harmfulWords', value ? JSON.stringify(value) : '[]');
      }
    },

    // Legacy field
    isCrisis: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
      field: 'is_crisis'
    },
  },
  {
    sequelize,
    modelName: "Journal",
    tableName: "journal_entries",
    timestamps: true,
    underscored: true, // This will automatically add underscored fields for timestamps
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Journal;
