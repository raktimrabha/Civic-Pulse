import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

// Get backend URL from environment variable
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Initialize Socket.IO ---
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);
    console.log('Attempting to connect socket...');
    newSocket.on('connect', () => console.log('Socket connected:', newSocket.id));
    newSocket.on('disconnect', () => console.log('Socket disconnected'));
    newSocket.on('connect_error', (err) => console.error('Socket connection error:', err));
    return () => { newSocket.disconnect(); }; // Cleanup
  }, []);

  // --- Fetch Initial Issues ---
  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BACKEND_URL}/api/issues`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setIssues(data || []);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError("Could not load issues from server.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchIssues();
  }, []);

  // --- Socket Event Listener for Updates ---
  useEffect(() => {
    if (!socket) return;

    const handleIssueUpdate = (updatedIssueData) => {
      console.log('Received issueUpdate:', updatedIssueData);
      setIssues(prevIssues =>
        prevIssues.map(issue =>
          issue.id === updatedIssueData.id
            ? { ...issue, votes: updatedIssueData.votes } // Only update votes
            : issue
        )
      );
    };

    socket.on('issueUpdate', handleIssueUpdate);
    return () => { socket.off('issueUpdate', handleIssueUpdate); }; // Cleanup listener
  }, [socket]);

  // --- API Call Function for Voting ---
  const voteOnIssue = async (issueId, voteType) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/issues/${issueId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });
      if (!response.ok) throw new Error('Vote failed');
      // Update will come via Socket.IO
    } catch (err) {
      console.error('Error voting on issue:', err);
      alert('Voting failed. Please try again.'); // Simple error feedback
    }
  };

  return (
    <>
      <Navbar />
      <main className="container mt-4">
        {isLoading && <p className="text-center">Loading issues...</p>}
        {error && <div className="alert alert-danger">{error}</div>}
        {!isLoading && !error && (
          <Routes>
            <Route path="/" element={
              <HomePage
                issues={issues}
                voteOnIssue={voteOnIssue} // Pass function down
              />}
            />
            <Route path="/sign-in/*" element={<SignInPage routing="path" path="/sign-in" />} />
            <Route path="/sign-up/*" element={<SignUpPage routing="path" path="/sign-up" />} />
            {/* Add other routes if needed */}
          </Routes>
        )}
      </main>
    </>
  );
}

export default App;
