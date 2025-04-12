// src/pages/CommunityCreate.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../utils/supabaseClient';

function CommunityCreate() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    locationPostalCode: '',
    locationCity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('communities')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            location_postal_code: formData.locationPostalCode,
            location_city: formData.locationCity,
            created_by: user.id
          }
        ])
        .select();

      if (error) throw error;
      navigate(`/communities/${data[0].id}`);
    } catch (err) {
      console.error('Error creating community:', err);
      setError('Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h2 className="mb-0">Create a New Community</h2>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Community Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="locationPostalCode" className="form-label">Postal Code</label>
                  <input
                    type="text"
                    id="locationPostalCode"
                    name="locationPostalCode"
                    className="form-control"
                    value={formData.locationPostalCode}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="locationCity" className="form-label">City</label>
                  <input
                    type="text"
                    id="locationCity"
                    name="locationCity"
                    className="form-control"
                    value={formData.locationCity}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Community'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityCreate;
