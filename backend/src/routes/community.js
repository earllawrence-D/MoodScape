import express from 'express';
import { 
  createPost, 
  getPosts, 
  likePost, 
  deletePost, 
  votePost,
  addComment,
  getComments
} from '../controllers/communityController.js';

import { protect } from '../middleware/auth.js';
import { validateCommunityPost, checkValidation } from '../utils/validator.js';

const router = express.Router();

/* -------------------------
      POSTS
------------------------- */

// Create new post
router.post('/', protect, validateCommunityPost, checkValidation, createPost);

// Get all posts
router.get('/', protect, getPosts);

// Delete post
router.delete('/:id', protect, deletePost);


/* -------------------------
      LIKES (old system)
------------------------- */

// Like/unlike toggle (still supported)
router.post('/:id/like', protect, likePost);


/* -------------------------
      VOTES (UP/DOWN)
------------------------- */

// New Reddit-style voting
router.post('/:id/vote', protect, votePost);


/* -------------------------
      COMMENTS
------------------------- */

// Add a comment to a post
router.post('/:id/comments', protect, addComment);

// Get all comments for a post
router.get('/:id/comments', protect, getComments);

export default router;
