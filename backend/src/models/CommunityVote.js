// src/models/CommunityVote.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import CommunityPost from './CommunityPost.js';
import User from './User.js';

const CommunityVote = sequelize.define('community_votes', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: CommunityPost, key: 'id' }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  type: {
    type: DataTypes.ENUM('up', 'down'),
    allowNull: false
  }
}, {
  timestamps: true,
  underscored: true
});

// Associations (optional but recommended)
CommunityPost.hasMany(CommunityVote, { foreignKey: 'post_id', onDelete: 'CASCADE' });
CommunityVote.belongsTo(CommunityPost, { foreignKey: 'post_id' });

User.hasMany(CommunityVote, { foreignKey: 'user_id', onDelete: 'CASCADE' });
CommunityVote.belongsTo(User, { foreignKey: 'user_id' });

export default CommunityVote;
