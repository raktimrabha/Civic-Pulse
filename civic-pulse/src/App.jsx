// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CommunityCreate from './pages/CommunityCreate';
import CommunityView from './pages/CommunityView';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/dashboard"
            element={
              <>
                <SignedIn>
                  <Dashboard />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/profile"
            element={
              <>
                <SignedIn>
                  <UserProfile />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route path="/communities/new" element={<CommunityCreate />} />
          <Route path="/communities/:id" element={<CommunityView />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
