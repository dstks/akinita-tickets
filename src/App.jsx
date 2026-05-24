import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, runTransaction, deleteDoc, updateDoc } from 'firebase/firestore';
import { Ticket, User, RefreshCw, Hash, Clock, AlertCircle, CheckCircle2, Edit2, Trash2, X, Check } from 'lucide-react';

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

export default function App() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [tickets, setTickets] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [myLatestTicket, setMyLatestTicket] = useState(null);
  const [error, setError] = useState('');
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
        setError("Αποτυχία σύνδεσης στον διακομιστή. (Failed to connect to server)");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const ticketsRef = collection(db, 'artifacts', appId, 'public', 'data', 'tickets');
    const unsubscribe = onSnapshot(ticketsRef, (snapshot) => {
      const fetchedTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedTickets.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
      setTickets(fetchedTickets);
    }, (error) => console.error("Error fetching tickets:", error));
    return () => unsubscribe();
  }, [user]);

  const generateTicketNumber = () => {
    const firstDigitChoices = [1, 2, 5, 6, 7, 8, 9];
    const firstDigit = firstDigitChoices[Math.floor(Math.random() * firstDigitChoices.length)];
    const nextFiveDigits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${firstDigit}${nextFiveDigits}`;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Παρακαλώ εισάγετε ένα όνομα για το εισιτήριο.");
      return;
    }
    setError('');
    setIsGenerating(true);
    try {
      let finalTicket = null;
      let attempts = 0;
      const maxRetries = 10;
      while (!finalTicket && attempts < maxRetries) {
        attempts++;
        const candidateTicketNumber = generateTicketNumber();
        const ticketRef = doc(db, 'artifacts', appId, 'public', 'data', 'tickets', candidateTicketNumber);
        try {
          await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(ticketRef);
            if (docSnap.exists()) throw new Error("Ticket collision"); 
            transaction.set(ticketRef, {
              ticketNumber: candidateTicketNumber,
              name: name.trim(),
              issuedAt: new Date().toISOString(),
              issuedBy: user.uid
            });
          });
          finalTicket = candidateTicketNumber;
        } catch (txError) {
          console.warn(`Σύγκρουση στην προσπάθεια ${attempts}, δημιουργία νέου...`);
        }
      }
      if (!finalTicket) {
        setError("Το δίκτυο είναι απασχολημένο. Αποτυχ
