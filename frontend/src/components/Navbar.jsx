import React from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from '@clerk/clerk-react';

function Navbar() {
  return (
    <nav className="navbar navbar-expand-sm navbar-light bg-light border-bottom sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Simple Civic App</Link>
        <div className="d-flex"> {/* Keep auth buttons on the right */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-outline-primary me-2 btn-sm">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn-primary btn-sm">Sign Up</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
