import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../config/api";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    photoURL: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
      if (!passwordRegex.test(formData.password)) {
        toast.error(
          "Password must have uppercase, lowercase, and at least 6 characters",
        );
        setLoading(false);
        return;
      }

      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // Save user to MongoDB
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      await apiClient.post("/users/create-user", {
        name: formData.name,
        email: formData.email,
        photoURL: formData.photoURL || "",
      });

      toast.success("Registration successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      await apiClient.post("/users/create-user", {
        name: userCredential.user.displayName,
        email: userCredential.user.email,
        photoURL: userCredential.user.photoURL || "",
      });

      toast.success("Registration successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold mb-6">Create Account</h2>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border mb-4 rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border mb-4 rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2 border mb-4 rounded"
          />
          <input
            type="url"
            name="photoURL"
            placeholder="Photo URL (optional)"
            value={formData.photoURL}
            onChange={handleChange}
            className="w-full p-2 border mb-6 rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mb-4"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full btn-secondary mb-4"
        >
          Sign up with Google
        </button>

        <p className="text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-color font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
