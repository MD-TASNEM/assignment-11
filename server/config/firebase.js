const admin = require("firebase-admin");

const initializeFirebase = () => {
  // Check if we have required credentials
  const hasRequiredCredentials =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL;

  if (!hasRequiredCredentials) {
    console.warn(
      "⚠️  Firebase credentials not found. Using mock mode for development.",
    );
    // Return a mock admin object for development
    return {
      auth: () => ({
        verifyIdToken: async (token) => ({
          uid: "mock-user-id",
          email: "test@example.com",
        }),
      }),
    };
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    return admin;
  } catch (error) {
    console.warn(
      "⚠️  Firebase initialization failed:",
      error.message,
      ". Using mock mode.",
    );
    return {
      auth: () => ({
        verifyIdToken: async (token) => ({
          uid: "mock-user-id",
          email: "test@example.com",
        }),
      }),
    };
  }
};

module.exports = initializeFirebase;
