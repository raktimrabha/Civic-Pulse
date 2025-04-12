// src/components/VoteButtons.jsx
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../utils/supabaseClient';

function VoteButtons({ postId, userVote, voteScore, onVoteChange }) {
  const { isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleVote = async (newVote) => {
    if (!isSignedIn) {
      alert('Please sign in to vote');
      return;
    }
    
    if (loading) return;
    setLoading(true);
    
    try {
      // Remove vote if clicking the same button again
      if (userVote === newVote) {
        await supabase
          .from('votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        onVoteChange(postId, 0, -newVote);
      } else {
        // If user already voted, update their vote
        if (userVote !== 0) {
          await supabase
            .from('votes')
            .update({ vote_type: newVote })
            .eq('post_id', postId)
            .eq('user_id', user.id);
            
          // Calculate vote change: new vote - old vote
          // For example, changing from -1 to 1 is a change of 2
          onVoteChange(postId, newVote, newVote - userVote);
        } else {
          // Insert new vote
          await supabase
            .from('votes')
            .insert([{
              post_id: postId,
              user_id: user.id,
              vote_type: newVote
            }]);
            
          onVoteChange(postId, newVote, newVote);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center">
      <button
        onClick={() => handleVote(1)}
        className={`btn btn-sm ${userVote === 1 ? 'btn-primary' : 'btn-outline-secondary'}`}
        disabled={loading}
        aria-label="Upvote"
      >
        <i className="bi bi-arrow-up"></i>
      </button>
      
      <div className="vote-score my-1 fw-bold">{voteScore}</div>
      
      <button
        onClick={() => handleVote(-1)}
        className={`btn btn-sm ${userVote === -1 ? 'btn-danger' : 'btn-outline-secondary'}`}
        disabled={loading}
        aria-label="Downvote"
      >
        <i className="bi bi-arrow-down"></i>
      </button>
    </div>
  );
}

export default VoteButtons;
