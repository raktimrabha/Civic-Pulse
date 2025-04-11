// src/pages/SignInPage.jsx
import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </div>
    );
}


