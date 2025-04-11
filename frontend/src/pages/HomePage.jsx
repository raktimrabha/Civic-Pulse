import React from 'react';
import IssueCard from '../components/IssueCard';
import { useAuth } from '@clerk/clerk-react';

// Receives issues list and vote function from App.jsx
function HomePage({ issues, voteOnIssue }) {
  const { isSignedIn } = useAuth(); // Get auth status

  return (
    <div>
      <h1 className="h4 mb-3">Community Issues Feed</h1>
      {issues.length > 0 ? (
        issues.map(issue => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onVote={voteOnIssue}
            canVote={isSignedIn} // Pass auth status to card
          />
        ))
      ) : (
        <p>No issues found.</p>
      )}
    </div>
  );
}

export default HomePage;
