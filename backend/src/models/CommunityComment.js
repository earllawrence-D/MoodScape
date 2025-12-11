import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import CommunityPost from './CommunityPost.js';

const CommunityComment = sequelize.define('CommunityComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CommunityPost,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'community_comments',
  timestamps: true,
  underscored: true
});

User.hasMany(CommunityComment, { foreignKey: 'user_id' });
CommunityComment.belongsTo(User, { foreignKey: 'user_id' });

CommunityPost.hasMany(CommunityComment, { foreignKey: 'post_id' });
CommunityComment.belongsTo(CommunityPost, { foreignKey: 'post_id' });

export default CommunityComment;
