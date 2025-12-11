import User from './User.js';
import Feedback from './Feedback.js';

// 1 USER → MANY FEEDBACKS
User.hasMany(Feedback, {
  foreignKey: 'user_id',
  as: 'feedbacks'
});

// FEEDBACK BELONGS TO USER
Feedback.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user' // MUST MATCH the controller include
});

export { User, Feedback };
