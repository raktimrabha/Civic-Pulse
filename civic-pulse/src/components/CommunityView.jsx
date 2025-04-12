// src/pages/CommunityView.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../utils/supabaseClient';
import CreatePostForm from '../components/CreatePostForm';
import PostsList from '../components/PostsList';

function CommunityView() {
  const { id } = useParams();
  const { isSignedIn } = useUser();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setCommunity(data);
      } catch (err) {
        console.error('Error fetching community:', err);
        setError('Failed to load community details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommunity();
  }, [id]);

  const handlePostCreated = () => {
    setShowCreateForm(false);
    // Force refresh of posts list
    // You could use a more elegant solution with context or state management
    window.location.reload();
  };

  if (loading) return <div className="text-center">Loading community details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!community) return <div className="alert alert-warning">Community not found</div>;

  return (
    <div>
      <div className="bg-light p-4 mb-4 rounded">
        <h1>{community.name}</h1>
        <p className="text-muted">
          {community.location_city}, {community.location_postal_code}
        </p>
        <p>{community.description}</p>
        
        {isSignedIn && (
          <div className="mb-3">
            {showCreateForm ? (
              <CreatePostForm 
                communityId={id} 
                onPostCreated={handlePostCreated} 
              />
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                Report an Issue
              </button>
            )}
          </div>
        )}
      </div>
      
      <h2 className="mb-3">Community Issues</h2>
      <PostsList communityId={id} />
    </div>
  );
}

export default CommunityView;
