// src/pages/SignUpPage.jsx
import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
     </div>
    );
}