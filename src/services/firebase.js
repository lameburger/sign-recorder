// Firebase Authentication implementation
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyADhNIsRXA7DlZuHeEa1R-O-aNpnDLkB0U",
  authDomain: "sign-recorder.firebaseapp.com",
  projectId: "sign-recorder",
  storageBucket: "sign-recorder.appspot.com",
  messagingSenderId: "860968765878",
  appId: "1:860968765878:web:a80dbd76d01fb0c80a5917",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);

// Auth service with Firebase Authentication
const auth = {
  get currentUser() {
    return firebaseAuth.currentUser;
  },

  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(firebaseAuth, callback);
  },

  signInWithEmailAndPassword: (email, password) => {
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  },

  createUserWithEmailAndPassword: (email, password) => {
    return createUserWithEmailAndPassword(firebaseAuth, email, password);
  },

  signOut: () => {
    return signOut(firebaseAuth);
  },

  updateProfile: (user, profileData) => {
    return updateProfile(user, profileData);
  },

  sendPasswordResetEmail: (email) => {
    return sendPasswordResetEmail(firebaseAuth, email);
  },
};

// Real Firebase Storage implementation
const storage = getStorage(app);


// Mock database service
const db = {
  collection: (collectionName) => {
    const getCollection = () =>
      JSON.parse(localStorage.getItem(collectionName) || "[]");
    const saveCollection = (data) =>
      localStorage.setItem(collectionName, JSON.stringify(data));

    return {
      add: (data) => {
        const collection = getCollection();
        const id = Date.now().toString();
        const newDoc = { id, ...data };

        saveCollection([...collection, newDoc]);
        return Promise.resolve({ id });
      },

      doc: (docId) => ({
        get: () => {
          const collection = getCollection();
          const doc = collection.find((item) => item.id === docId);

          return Promise.resolve({
            exists: !!doc,
            data: () => doc,
          });
        },

        set: (data) => {
          const collection = getCollection();
          const index = collection.findIndex((item) => item.id === docId);

          if (index !== -1) {
            collection[index] = { id: docId, ...data };
          } else {
            collection.push({ id: docId, ...data });
          }

          saveCollection(collection);
          return Promise.resolve();
        },

        update: (data) => {
          const collection = getCollection();
          const index = collection.findIndex((item) => item.id === docId);

          if (index !== -1) {
            collection[index] = { ...collection[index], ...data };
            saveCollection(collection);
          }

          return Promise.resolve();
        },

        delete: () => {
          const collection = getCollection();
          const filtered = collection.filter((item) => item.id !== docId);
          saveCollection(filtered);
          return Promise.resolve();
        },
      }),

      where: (field, operator, value) => ({
        get: () => {
          const collection = getCollection();
          let filteredDocs = [];

          if (operator === "==") {
            filteredDocs = collection.filter((item) => item[field] === value);
          } else if (operator === "!=") {
            filteredDocs = collection.filter((item) => item[field] !== value);
          }

          return Promise.resolve({
            forEach: (callback) => {
              filteredDocs.forEach((doc) => {
                callback({
                  id: doc.id,
                  data: () => doc,
                });
              });
            },
            docs: filteredDocs.map((doc) => ({
              id: doc.id,
              data: () => doc,
            })),
          });
        },
      }),

      orderBy: () => ({
        limit: () => ({
          get: () => {
            const collection = getCollection();
            return Promise.resolve({
              docs: collection.slice(0, 10).map((doc) => ({
                id: doc.id,
                data: () => doc,
              })),
            });
          },
        }),
      }),
    };
  },

  doc: (path) => {
    const parts = path.split("/");
    const collectionName = parts[0];
    const docId = parts[1];

    return {
      get: () => {
        const collection = JSON.parse(
          localStorage.getItem(collectionName) || "[]"
        );
        const doc = collection.find((item) => item.id === docId);

        return Promise.resolve({
          exists: !!doc,
          data: () => doc,
        });
      },
    };
  },

  serverTimestamp: () => new Date().toISOString(),
};

export { auth, storage, db };
