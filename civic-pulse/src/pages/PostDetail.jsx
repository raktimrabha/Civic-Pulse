// src/pages/PostDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../utils/supabaseClient';
import Comments from '../components/Comments';
import VoteButtons from '../components/VoteButtons';

function PostDetail() {
  const { id } = useParams();
  const { user } = useUser();
  const [post, setPost] = useState(null);
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userVote, setUserVote] = useState(0);
  const [voteScore, setVoteScore] = useState(0);

  useEffect(() => {
    async function fetchPostDetails() {
      try {
        // Get post
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (postError) throw postError;
        setPost(postData);
        
        // Get community
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('*')
          .eq('id', postData.community_id)
          .single();
          
        if (communityError) throw communityError;
        setCommunity(communityData);
        
        // Get vote count
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('post_id', id);
          
        if (votesError) throw votesError;
        
        const upvotes = votesData.filter(v => v.vote_type === 1).length;
        const downvotes = votesData.filter(v => v.vote_type === -1).length;
        setVoteScore(upvotes - downvotes);
        
        // Get user's vote if logged in
        if (user) {
          const { data: userVoteData } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('post_id', id)
            .eq('user_id', user.id)
            .single();
            
          setUserVote(userVoteData?.vote_type || 0);
        }
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Failed to load post details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPostDetails();
  }, [id, user]);

  const handleVoteChange = (postId, newUserVote, voteChange) => {
    setUserVote(newUserVote);
    setVoteScore(current => current + voteChange);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      setPost(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) return <div className="text-center">Loading post details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!post) return <div className="alert alert-warning">Post not found</div>;

  return (
    <div>
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/communities/${community.id}`}>{community.name}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Issue
          </li>
        </ol>
      </nav>
      
      <div className="card mb-4">
        <div className="card-body d-flex">
          <div className="vote-column me-3">
            <VoteButtons 
              postId={post.id}
              userVote={userVote}
              voteScore={voteScore}
              onVoteChange={handleVoteChange}
            />
          </div>
          
          <div className="content-column flex-grow-1">
            <div className="d-flex justify-content-between align-items-start">
              <h1 className="mb-1">{post.title}</h1>
              <span className={`badge bg-${getStatusBadgeColor(post.status)}`}>
                {formatStatus(post.status)}
              </span>
            </div>
            
            <p className="text-muted">
              Posted on {new Date(post.created_at).toLocaleDateString()}
              {post.is_authority_post && (
                <span className="ms-2 badge bg-info">Official</span>
              )}
            </p>
            
            <div className="post-content mb-4">
              <p>{post.description}</p>
            </div>
            
            {/* Authority Status Update - simplified for MVP */}
            {user && user.id === post.author_id && (
              <div className="status-update mb-3">
                <h5>Update Status:</h5>
                <div className="btn-group">
                  <button 
                    className={`btn ${post.status === 'open' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => handleStatusChange('open')}
                  >
                    Open
                  </button>
                  <button 
                    className={`btn ${post.status === 'in_progress' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => handleStatusChange('in_progress')}
                  >
                    In Progress
                  </button>
                  <button 
                    className={`btn ${post.status === 'resolved' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handleStatusChange('resolved')}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Comments postId={id} />
    </div>
  );
}

function formatStatus(status) {
  switch (status) {
    case 'open': return 'Open';
    case 'in_progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    default: return status;
  }
}

function getStatusBadgeColor(status) {
  switch (status) {
    case 'open': return 'secondary';
    case 'in_progress': return 'warning';
    case 'resolved': return 'success';
    default: return 'secondary';
  }
}

export default PostDetail;
