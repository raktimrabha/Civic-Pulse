import React from 'react';
// Removed Link and TimeAgo for simplicity

// Receives issue data, onVote function, and canVote boolean
function IssueCard({ issue, onVote, canVote }) {

  const handleVoteClick = (e, voteType) => {
    e.preventDefault();
    if (canVote) {
      onVote(issue.id, voteType);
    } else {
      alert("Please sign in to vote."); // Simple feedback
    }
  };

  return (
    <div className="card issue-card mb-3">
      <div className="row g-0">
        {/* Vote Column */}
        <div className="col-auto vote-controls">
          <button
            className="vote-btn up-btn"
            aria-label="Upvote"
            onClick={(e) => handleVoteClick(e, 'up')}
            disabled={!canVote}
          >
            ⬆
          </button>
          <span className="vote-count">{issue.votes}</span>
          <button
            className="vote-btn down-btn"
            aria-label="Downvote"
            onClick={(e) => handleVoteClick(e, 'down')}
            disabled={!canVote}
          >
            ⬇
          </button>
        </div>

        {/* Content Column */}
        <div className="col">
          <div className="card-body">
            <h5 className="card-title h6 mb-1">{issue.title}</h5>
            <p className="card-text small text-muted">{issue.description}</p>
            {/* Add comment count or link later if needed */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueCard;
