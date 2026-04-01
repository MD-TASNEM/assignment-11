import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-20 text-center">
      <div className="max-w-md mx-auto card">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-4xl font-bold mb-4 text-error-color">
          Payment Cancelled
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your payment was cancelled. You can try again anytime.
        </p>

        <button
          onClick={() => navigate("/pricing")}
          className="btn-primary w-full mb-3"
        >
          Back to Pricing
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-outline w-full"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
