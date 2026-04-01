import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import apiClient from "../config/api";
import toast from "react-hot-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        if (sessionId) {
          const response = await apiClient.post(
            "/payments/check-payment-status",
            { sessionId },
          );
          setPaymentStatus(response.data);

          if (response.data.paymentStatus === "paid") {
            toast.success("Payment successful! You are now premium!");
          }
        }
      } catch (error) {
        console.error("Error checking payment:", error);
        toast.error("Error verifying payment");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-20 text-center">
      <div className="max-w-md mx-auto card">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-4xl font-bold mb-4 text-green-600">
          Payment Successful!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Thank you for upgrading to premium. Enjoy unlimited access to all
          features!
        </p>

        {paymentStatus && (
          <div className="bg-light-bg p-4 rounded-lg mb-8 text-left">
            <h3 className="font-bold mb-2">Payment Details:</h3>
            <p className="text-sm text-gray-600">
              Status: <span className="font-bold text-green-600">PAID</span>
            </p>
            <p className="text-sm text-gray-600">
              Amount: <span className="font-bold">$15.00</span>
            </p>
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          className="btn-primary w-full mb-3"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate("/public-lessons")}
          className="btn-outline w-full"
        >
          Browse Lessons
        </button>
      </div>
    </div>
  );
}
