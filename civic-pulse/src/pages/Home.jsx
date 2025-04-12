// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import CommunitiesList from '../components/CommunitiesList';

function Home() {
  return (
    <div>
      <div className="jumbotron bg-light p-5 rounded mb-4">
        <h1 className="display-4">Welcome to LocalConnect</h1>
        <p className="lead">
          Your platform for local civic engagement and community action.
        </p>
        <hr className="my-4" />
        <p>
          Join communities in your area, raise local issues, and connect directly with your representatives.
        </p>
        <Link to="/communities/new" className="btn btn-primary btn-lg">
          Create a Community
        </Link>
      </div>
      
      <h2 className="mb-4">Active Communities</h2>
      <CommunitiesList />
    </div>
  );
}

export default Home;
