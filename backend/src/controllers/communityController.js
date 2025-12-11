import CommunityPost from '../models/CommunityPost.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';
import CommunityComment from '../models/CommunityComment.js';
import CommunityVote from '../models/CommunityVote.js';

/* -----------------------------------------------------------
   CREATE POST
------------------------------------------------------------ */
export const createPost = async (req, res) => {
  try {
    const { title, content, category, is_anonymous } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Post content cannot be empty"
      });
    }

    const post = await CommunityPost.create({
      user_id: userId,
      title: title || null,
      content: content.trim(),
      category: category || "General",
      is_anonymous: is_anonymous || false
    });

    const postWithUser = await CommunityPost.findByPk(post.id, {
      include: [
        { model: User, attributes: ["id", "username", "full_name"] }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: postWithUser
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error.message
    });
  }
};


/* -----------------------------------------------------------
   GET POSTS
------------------------------------------------------------ */
export const getPosts = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const posts = await CommunityPost.findAll({
      include: [
        { model: User, attributes: ["id", "username", "full_name"] },
        { 
          model: CommunityComment, 
          include: [{ model: User, attributes: ["id", "username"] }] 
        },
        {
          model: CommunityVote
        }
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await CommunityPost.count();

    // apply anonymity
    const postsData = posts.map(post => {
      const p = post.toJSON();
      if (p.is_anonymous) {
        p.User = { username: "Anonymous", full_name: null };
      }
      return p;
    });

    res.json({
      success: true,
      data: {
        posts: postsData,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve posts",
      error: error.message
    });
  }
};


/* -----------------------------------------------------------
   LIKE / UNLIKE POST  (Old System)
------------------------------------------------------------ */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await CommunityPost.findByPk(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const LikeModel = sequelize.models.community_likes;

    const [like, created] = await LikeModel.findOrCreate({
      where: { post_id: id, user_id: userId }
    });

    if (!created) {
      await like.destroy();
      await post.decrement("likes_count");
      return res.json({ success: true, message: "Post unliked", data: { liked: false } });
    }

    await post.increment("likes_count");
    res.json({ success: true, message: "Post liked", data: { liked: true } });

  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to like post",
      error: error.message
    });
  }
};


/* -----------------------------------------------------------
   VOTE POST (UP/DOWN)
------------------------------------------------------------ */
export const votePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // up or down
    const userId = req.user.id;

    if (!["up", "down"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid vote type" });
    }

    const post = await CommunityPost.findByPk(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const existing = await CommunityVote.findOne({
      where: { post_id: id, user_id: userId }
    });

    // toggle same vote → remove
    if (existing && existing.type === type) {
      await existing.destroy();
    } 
    // switch vote
    else if (existing) {
      existing.type = type;
      await existing.save();
    }
    // new vote
    else {
      await CommunityVote.create({
        post_id: id,
        user_id: userId,
        type
      });
    }

    // update counts
    const upvotes = await CommunityVote.count({ where: { post_id: id, type: "up" } });
    const downvotes = await CommunityVote.count({ where: { post_id: id, type: "down" } });

    await post.update({ upvotes, downvotes });

    res.json({
      success: true,
      message: "Vote recorded",
      data: { upvotes, downvotes }
    });

  } catch (error) {
    console.error("Vote post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to vote",
      error: error.message
    });
  }
};


/* -----------------------------------------------------------
   ADD COMMENT
------------------------------------------------------------ */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    const comment = await CommunityComment.create({
      post_id: id,
      user_id: userId,
      content: content.trim()
    });

    const fullComment = await CommunityComment.findByPk(comment.id, {
      include: [{ model: User, attributes: ["id", "username"] }]
    });

    res.json({
      success: true,
      message: "Comment added",
      data: fullComment
    });

  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message
    });
  }
};


/* -----------------------------------------------------------
   GET COMMENTS
------------------------------------------------------------ */
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await CommunityComment.findAll({
      where: { post_id: id },
      include: [{ model: User, attributes: ["id", "username"] }],
      order: [["created_at", "ASC"]]
    });

    res.json({ success: true, data: comments });

  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get comments",
      error: error.message
    });
  }
};


/* -----------------------------------------------------------
   DELETE POST
------------------------------------------------------------ */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await CommunityPost.findByPk(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete post"
      });
    }

    await post.destroy();

    res.json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error.message
    });
  }
};
