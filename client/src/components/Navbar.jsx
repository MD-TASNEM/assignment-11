import { Link } from "react-router-dom";
import { auth } from "../config/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="font-bold text-2xl text-primary-color">
          Digital Lessons
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-primary-color">
            Home
          </Link>
          {user && (
            <>
              <Link
                to="/dashboard/add-lesson"
                className="hover:text-primary-color"
              >
                Add Lesson
              </Link>
              <Link
                to="/dashboard/my-lessons"
                className="hover:text-primary-color"
              >
                My Lessons
              </Link>
              <Link to="/pricing" className="hover:text-primary-color">
                Pricing
              </Link>
            </>
          )}
          <Link to="/public-lessons" className="hover:text-primary-color">
            Explore
          </Link>

          {!user ? (
            <>
              <Link to="/login" className="btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn-secondary">
                Register
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 bg-primary-color text-white rounded-full flex items-center justify-center"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  user.email?.[0].toUpperCase()
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                  <div className="px-4 py-2 border-b">
                    <p className="font-bold">{user.displayName || "User"}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    to="/dashboard/profile"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      auth.signOut();
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
