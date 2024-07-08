// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDnq4maxZFeF6q6gkPbNXHruueZRroKTck",
  authDomain: "hanium-36cc2.firebaseapp.com",
  projectId: "hanium-36cc2",
  storageBucket: "hanium-36cc2.appspot.com",
  messagingSenderId: "956025007237",
  appId: "1:956025007237:web:5124acc74cb418f1900dec",
  measurementId: "G-RFESKEDYKJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App firestore={firestore} analytics={analytics} />
        </React.StrictMode>
    );
} else {
    console.error("Root container is not found");
}

reportWebVitals();
