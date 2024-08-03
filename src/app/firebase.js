import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCkyu-6ZUukPpEhEGWuPm5h1QSgdtUnB4I",
  authDomain: "pantry-tracker-d4401.firebaseapp.com",
  projectId: "pantry-tracker-d4401",
  storageBucket: "pantry-tracker-d4401.appspot.com",
  messagingSenderId: "830535593965",
  appId: "1:830535593965:web:c04c1dd93f3f05565bc1e4",
};
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore };
