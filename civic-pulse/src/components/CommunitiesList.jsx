// src/components/CommunitiesList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

function CommunitiesList() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setCommunities(data);
      } catch (err) {
        console.error('Error fetching communities:', err);
        setError('Failed to load communities');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommunities();
  }, []);

  if (loading) return <div className="text-center">Loading communities...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="row">
      {communities.length === 0 ? (
        <div className="col-12">
          <div className="alert alert-info">
            No communities found. Be the first to create one!
          </div>
        </div>
      ) : (
        communities.map(community => (
          <div className="col-md-4 mb-4" key={community.id}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{community.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">
                  {community.location_city}, {community.location_postal_code}
                </h6>
                <p className="card-text">
                  {community.description?.length > 100
                    ? `${community.description.substring(0, 100)}...`
                    : community.description}
                </p>
              </div>
              <div className="card-footer bg-transparent">
                <Link 
                  to={`/communities/${community.id}`} 
                  className="btn btn-primary btn-sm"
                >
                  View Community
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default CommunitiesList;
