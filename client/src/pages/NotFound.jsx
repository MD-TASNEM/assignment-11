import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container mx-auto py-20 text-center min-h-screen flex flex-col justify-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-6">Page Not Found</p>
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary">
        Go Home
      </Link>
    </div>
  );
}
