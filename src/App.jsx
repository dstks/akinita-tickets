const firebaseConfig = {
     apiKey: "AIzaSyDdVBHKOU3pGwOcIr7kTCMBWHOw5Z7Rli0",
     authDomain: "akinita-tickets.firebaseapp.com",
     projectId: "akinita-tickets",
     storageBucket: "akinita-tickets.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   const app = initializeApp(firebaseConfig);
   const auth = getAuth(app);
   const db = getFirestore(app);
   const appId = 'akinita-2026';