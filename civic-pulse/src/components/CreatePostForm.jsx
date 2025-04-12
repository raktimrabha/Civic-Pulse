// src/components/CreatePostForm.jsx
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../utils/supabaseClient';

function CreatePostForm({ communityId, onPostCreated }) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    description: ''
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
        .from('posts')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            community_id: communityId,
            author_id: user.id
          }
        ])
        .select();

      if (error) throw error;
      
      setFormData({ title: '', description: '' });
      if (onPostCreated) onPostCreated(data[0]);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white">
        Report an Issue
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summarize the issue"
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
              rows="4"
              placeholder="Describe the issue in detail"
              required
            ></textarea>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Issue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePostForm;
