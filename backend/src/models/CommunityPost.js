import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const CommunityPost = sequelize.define('CommunityPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'General'
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  downvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'community_posts',
  timestamps: true,
  underscored: true
});

User.hasMany(CommunityPost, { foreignKey: 'user_id' });
CommunityPost.belongsTo(User, { foreignKey: 'user_id' });

export default CommunityPost;
