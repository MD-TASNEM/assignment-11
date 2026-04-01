const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getDB } = require("../config/db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Create checkout session
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: req.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd", // Stripe uses USD; you can adjust
            product_data: {
              name: "Digital Life Lessons - Premium Plan",
              description: "Lifetime Premium Access",
            },
            unit_amount: 1500 * 100, // $15.00 (you can adjust for BDT equivalent)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      customer_email: user.email,
      metadata: {
        userId: req.userId,
      },
    });

    // Store payment record
    const paymentsCollection = db.collection("payments");
    const payment = {
      _id: new require("mongodb").ObjectId().toString(),
      userId: req.userId,
      stripeSessionId: session.id,
      amount: 1500,
      currency: "usd",
      status: "pending",
      planType: "premium",
      createdAt: new Date(),
    };

    await paymentsCollection.insertOne(payment);

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Check payment status
router.post("/check-payment-status", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const db = getDB();
    const usersCollection = db.collection("users");
    const paymentsCollection = db.collection("payments");

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Update user to premium
      await usersCollection.updateOne(
        { _id: req.userId },
        { $set: { isPremium: true, updatedAt: new Date() } },
      );

      // Update payment record
      await paymentsCollection.updateOne(
        { stripeSessionId: sessionId },
        {
          $set: {
            status: "completed",
            completedAt: new Date(),
          },
        },
      );

      res.json({ status: "paid", message: "Payment successful" });
    } else {
      res.json({ status: session.payment_status });
    }
  } catch (error) {
    console.error("Error checking payment status:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Webhook to handle payment completion
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );

      const db = getDB();
      const usersCollection = db.collection("users");
      const paymentsCollection = db.collection("payments");

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Update user to premium
        await usersCollection.updateOne(
          { _id: session.metadata.userId },
          { $set: { isPremium: true, updatedAt: new Date() } },
        );

        // Update payment record
        await paymentsCollection.updateOne(
          { stripeSessionId: session.id },
          {
            $set: {
              status: "completed",
              stripeCustomerId: session.customer,
              completedAt: new Date(),
            },
          },
        );
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  },
);

module.exports = router;
