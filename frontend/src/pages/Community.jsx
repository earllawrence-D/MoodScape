import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import { Send, ArrowUp, ArrowDown, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import { communityAPI } from "../utils/api";

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [voting, setVoting] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [comments, setComments] = useState({});

  const currentUserId = Number(localStorage.getItem("user_id")); // adjust to your auth
  const observer = useRef();
  const POSTS_PER_PAGE = 20;

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await communityAPI.getPosts({ limit: POSTS_PER_PAGE, page: pageNum });
      const newPosts = res.data?.data?.posts || [];
      if (newPosts.length < POSTS_PER_PAGE) setHasMore(false);
      setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchPosts();
    const interval = setInterval(() => fetchPosts(), 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchPosts]);

  // Infinite scroll
  const lastPostRef = useCallback(
    node => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasMore]
  );

  useEffect(() => {
    if (page === 1) return;
    fetchPosts(page, true);
  }, [page, fetchPosts]);

  // Create post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return alert("Post content cannot be empty");
    setLoading(true);
    try {
      const res = await communityAPI.createPost({
        title: title.trim(),
        content: content.trim(),
        category,
        is_anonymous: isAnonymous,
      });
      setTitle("");
      setContent("");
      setCategory("General");
      setIsAnonymous(false);
      setModalOpen(false);
      setPosts(prev => [res.data, ...prev]);
    } catch (err) {
      console.error("Error creating post:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  // Vote post
  const handleVote = async (postId, type) => {
    if (voting[postId]) return;
    setVoting(prev => ({ ...prev, [postId]: true }));

    try {
      const res = await communityAPI.votePost(postId, { type });
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                upvotes: res.data.data.upvotes,
                downvotes: res.data.data.downvotes,
              }
            : post
        )
      );
    } catch (err) {
      console.error("Voting failed:", err);
    } finally {
      setVoting(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Delete post
  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await communityAPI.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to delete post");
    }
  };

  // Add comment
  const submitComment = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    try {
      await communityAPI.addComment(postId, { content });
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));

      // Reload comments for this post
      const res = await communityAPI.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: res.data.data }));
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#d5f8f0] flex flex-col items-center">
      <Navbar />
      <div className="w-full max-w-3xl p-6 flex flex-col gap-6">

        {/* Create Post Button */}
        <button
          onClick={() => setModalOpen(true)}
          className="bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-600 transition-colors self-start"
        >
          <Plus className="w-5 h-5 mr-2" /> Create Post
        </button>

        {/* Post Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >✕</button>

              <h2 className="font-bold text-xl mb-3">Create a Post</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Post title (optional)"
                  className="p-3 border rounded-lg focus:outline-teal-400"
                  disabled={loading}
                />
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your post..."
                  className="p-3 border rounded-lg focus:outline-teal-400 resize-none"
                  rows={4}
                  disabled={loading}
                />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="p-2 border rounded-lg focus:outline-teal-400"
                >
                  <option value="General">General</option>
                  <option value="Advice">Advice</option>
                  <option value="Vent">Vent</option>
                  <option value="Fun">Fun</option>
                </select>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-sm text-gray-700 flex items-center">
                    {isAnonymous ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    Post anonymously
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 flex items-center transition-colors"
                >
                  <Send className="w-5 h-5 mr-2" /> {loading ? "Posting..." : "Post"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="bg-white rounded-xl p-4 border-2 border-teal-400 shadow-md flex flex-col max-h-[600px] overflow-y-auto space-y-4">
          {posts.length > 0 ? (
            posts.map((post, idx) => {
              const isLastPost = idx === posts.length - 1;
              const postComments = comments[post.id] || post.CommunityComments || [];
              return (
                <div
                  key={post.id || `post-${idx}`}
                  ref={isLastPost ? lastPostRef : null}
                  className="p-4 border rounded-lg shadow-sm bg-gray-50 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {post.is_anonymous ? "Anonymous" : post.User?.username || `User-${post.id || idx}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleString()} • {post.category}
                      </p>
                    </div>
                    {!post.is_anonymous && post.user_id === currentUserId && (
                      <button onClick={() => handleDelete(post.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-gray-800 mb-2 whitespace-pre-wrap font-medium">{post.title}</p>
                  <p className="text-gray-700 mb-2 whitespace-pre-wrap">{post.content}</p>

                  <div className="flex items-center space-x-4 mb-2">
                    <button
                      onClick={() => handleVote(post.id, "up")}
                      disabled={voting[post.id]}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                    >
                      <ArrowUp className="w-5 h-5" /> <span>{post.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleVote(post.id, "down")}
                      disabled={voting[post.id]}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <ArrowDown className="w-5 h-5" /> <span>{post.downvotes}</span>
                    </button>
                  </div>

                  {/* Comments */}
                  {postComments.length > 0 && (
                    <div className="mt-2 border-t pt-2 space-y-1">
                      {postComments.map((c, cIdx) => (
                        <div key={`${post.id}-${c.id || cIdx}`} className="pl-4 border-l ml-2">
                          <p className="text-sm">
                            <span className="font-semibold">{c.User?.username || "Anonymous"}:</span> {c.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      className="flex-1 p-2 border rounded-lg"
                    />
                    <button
                      onClick={() => submitComment(post.id)}
                      className="bg-teal-500 text-white px-4 rounded-lg hover:bg-teal-600"
                    >
                      Send
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>No posts yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;
