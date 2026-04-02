// Fill in your Firebase config to enable cloud sync
// Leave empty to use AsyncStorage only
const firebaseConfig = {
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_AUTH_DOMAIN",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_STORAGE_BUCKET",
  // messagingSenderId: "YOUR_SENDER_ID",
  // appId: "YOUR_APP_ID",
};

export let fbApp: any = null;
export let fbAuth: any = null;
export let fbDb: any = null;
export const isFirebaseConfigured = false; // set to true when config is filled
