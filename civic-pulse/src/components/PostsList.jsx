// src/components/PostsList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../utils/supabaseClient';
import VoteButtons from './VoteButtons';

function PostsList({ communityId }) {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        // Get posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id, 
            title, 
            description, 
            status,
            created_at, 
            author_id, 
            is_authority_post
          `)
          .eq('community_id', communityId)
          .order('created_at', { ascending: false });
          
        if (postsError) throw postsError;

        // Get vote counts for each post
        const postsWithVotes = await Promise.all(postsData.map(async (post) => {
          const { data: votesData, error: votesError } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('post_id', post.id);
            
          if (votesError) throw votesError;
          
          // Calculate upvotes and downvotes
          const upvotes = votesData.filter(v => v.vote_type === 1).length;
          const downvotes = votesData.filter(v => v.vote_type === -1).length;
          
          // Get user's vote if logged in
          let userVote = 0;
          if (user) {
            const { data: userVoteData } = await supabase
              .from('votes')
              .select('vote_type')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();
              
            userVote = userVoteData?.vote_type || 0;
          }
          
          return {
            ...post,
            upvotes,
            downvotes,
            voteScore: upvotes - downvotes,
            userVote
          };
        }));
        
        // Sort by vote score
        postsWithVotes.sort((a, b) => b.voteScore - a.voteScore);
        setPosts(postsWithVotes);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, [communityId, user]);

  const handleVoteChange = (postId, newUserVote, voteChange) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          userVote: newUserVote,
          voteScore: post.voteScore + voteChange,
          upvotes: newUserVote === 1 
            ? post.upvotes + 1 
            : (post.userVote === 1 ? post.upvotes - 1 : post.upvotes),
          downvotes: newUserVote === -1 
            ? post.downvotes + 1 
            : (post.userVote === -1 ? post.downvotes - 1 : post.downvotes)
        };
      }
      return post;
    }));
  };

  if (loading) return <div className="text-center">Loading posts...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="posts-list">
      {posts.length === 0 ? (
        <div className="alert alert-info">
          No issues have been reported in this community yet. Be the first!
        </div>
      ) : (
        posts.map(post => (
          <div className="card mb-3" key={post.id}>
            <div className="card-body d-flex">
              <div className="vote-column me-3">
                <VoteButtons 
                  postId={post.id}
                  userVote={post.userVote}
                  voteScore={post.voteScore}
                  onVoteChange={handleVoteChange}
                />
              </div>
              <div className="content-column flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <h5 className="card-title mb-1">
                    <Link to={`/posts/${post.id}`} className="text-decoration-none">
                      {post.title}
                    </Link>
                  </h5>
                  <span className={`badge bg-${getStatusBadgeColor(post.status)}`}>
                    {formatStatus(post.status)}
                  </span>
                </div>
                <p className="card-text text-muted small mb-2">
                  Posted {formatDate(post.created_at)}
                  {post.is_authority_post && (
                    <span className="ms-2 badge bg-info">Official</span>
                  )}
                </p>
                <p className="card-text">
                  {post.description.length > 200
                    ? `${post.description.substring(0, 200)}...`
                    : post.description}
                </p>
                <Link to={`/posts/${post.id}`} className="btn btn-sm btn-outline-primary">
                  View Discussion
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
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

export default PostsList;
