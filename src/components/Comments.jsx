// src/components/Comments.jsx
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../utils/supabaseClient';

function Comments({ postId }) {
  const { isSignedIn, user } = useUser();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchComments() {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        setComments(data);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    }
    
    fetchComments();
    
    // Set up real-time subscription for new comments
    const subscription = supabase
      .channel('public:comments')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, payload => {
        setComments(current => [...current, payload.new]);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          author_id: user.id,
          content: newComment,
          is_authority_comment: false // Set based on user role in a real app
        }]);
        
      if (error) throw error;
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center mt-4">Loading comments...</div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="comments-section mt-4">
      <h4 className="mb-3">Discussion ({comments.length})</h4>
      
      {isSignedIn && (
        <div className="card mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="newComment" className="form-label">Add a comment</label>
                <textarea
                  id="newComment"
                  className="form-control"
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {comments.length === 0 ? (
        <div className="alert alert-info">
          No comments yet. Be the first to start the discussion!
        </div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <div className="card mb-3" key={comment.id}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>User {comment.author_id.substring(0, 6)}</strong>
                    {comment.is_authority_comment && (
                      <span className="ms-2 badge bg-info">Official</span>
                    )}
                  </div>
                  <small className="text-muted">
                    {new Date(comment.created_at).toLocaleString()}
                  </small>
                </div>
                <p className="card-text">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Comments;
