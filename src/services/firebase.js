// Create a pure localStorage-based implementation without Firebase dependencies

// Mock auth service
const auth = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')),
    
    onAuthStateChanged: (callback) => {
      // Immediately call with current user
      const user = JSON.parse(localStorage.getItem('currentUser'));
      callback(user);
      
      // Listen for storage events to update auth state
      const listener = () => {
        const updatedUser = JSON.parse(localStorage.getItem('currentUser'));
        callback(updatedUser);
      };
      
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    },
    
    signInWithEmailAndPassword: (email, password) => {
      // Simplified login - just check if email and password match
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Remove password before storing in currentUser
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return Promise.resolve({ user: userWithoutPassword });
      } else {
        console.error('Login failed: User not found or password incorrect');
        return Promise.reject({ code: 'auth/user-not-found' });
      }
    },
    
    createUserWithEmailAndPassword: (email, password) => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (users.some(u => u.email === email)) {
        return Promise.reject({ code: 'auth/email-already-in-use' });
      }
      
      const newUser = { uid: Date.now().toString(), email, password };
      localStorage.setItem('users', JSON.stringify([...users, newUser]));
      
      const { password: _, ...userWithoutPassword } = newUser;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return Promise.resolve({ user: userWithoutPassword });
    },
    
    signOut: () => {
      localStorage.removeItem('currentUser');
      return Promise.resolve();
    },
    
    updateProfile: (user, { displayName }) => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const updatedUser = { ...currentUser, displayName };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update in users array too
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => 
        u.uid === user.uid ? { ...u, displayName } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      return Promise.resolve();
    },
  
    sendPasswordResetEmail: (email) => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return Promise.reject({ code: 'auth/user-not-found' });
      }
      
      console.log(`Password reset email would be sent to ${email} in production`);
      return Promise.resolve();
    }
  };
  
  // Mock storage service
  const storage = {
    ref: (path) => ({
      put: (file) => {
        const files = JSON.parse(localStorage.getItem('files') || '{}');
        const fileId = Date.now().toString();
        const fileUrl = URL.createObjectURL(file);
        
        files[path + '/' + fileId] = { 
          url: fileUrl,
          metadata: {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          }
        };
        
        localStorage.setItem('files', JSON.stringify(files));
        return Promise.resolve();
      },
      getDownloadURL: () => {
        const files = JSON.parse(localStorage.getItem('files') || '{}');
        const fileEntry = Object.entries(files).find(([key]) => key.startsWith(path));
        
        if (fileEntry) {
          return Promise.resolve(fileEntry[1].url);
        } else {
          return Promise.reject(new Error('File not found'));
        }
      }
    }),
    uploadBytes: (ref, blob) => {
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Store in localStorage
      const files = JSON.parse(localStorage.getItem('files') || '{}');
      files[ref._location.path_] = { url };
      localStorage.setItem('files', JSON.stringify(files));
      
      return Promise.resolve({ ref });
    },
    getDownloadURL: (ref) => {
      const files = JSON.parse(localStorage.getItem('files') || '{}');
      const fileData = files[ref._location.path_];
      
      if (fileData) {
        return Promise.resolve(fileData.url);
      } else {
        return Promise.reject(new Error('File not found'));
      }
    },
    deleteObject: (ref) => {
      const files = JSON.parse(localStorage.getItem('files') || '{}');
      delete files[ref._location.path_];
      localStorage.setItem('files', JSON.stringify(files));
      
      return Promise.resolve();
    }
  };
  
  // Mock database service
  const db = {
    collection: (collectionName) => {
      const getCollection = () => JSON.parse(localStorage.getItem(collectionName) || '[]');
      const saveCollection = (data) => localStorage.setItem(collectionName, JSON.stringify(data));
      
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
            const doc = collection.find(item => item.id === docId);
            
            return Promise.resolve({
              exists: !!doc,
              data: () => doc
            });
          },
          
          set: (data) => {
            const collection = getCollection();
            const index = collection.findIndex(item => item.id === docId);
            
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
            const index = collection.findIndex(item => item.id === docId);
            
            if (index !== -1) {
              collection[index] = { ...collection[index], ...data };
              saveCollection(collection);
            }
            
            return Promise.resolve();
          },
          
          delete: () => {
            const collection = getCollection();
            const filtered = collection.filter(item => item.id !== docId);
            saveCollection(filtered);
            return Promise.resolve();
          }
        }),
        
        where: (field, operator, value) => ({
          get: () => {
            const collection = getCollection();
            let filteredDocs = [];
            
            if (operator === '==') {
              filteredDocs = collection.filter(item => item[field] === value);
            } else if (operator === '!=') {
              filteredDocs = collection.filter(item => item[field] !== value);
            }
            
            return Promise.resolve({
              forEach: (callback) => {
                filteredDocs.forEach(doc => {
                  callback({
                    id: doc.id,
                    data: () => doc
                  });
                });
              },
              docs: filteredDocs.map(doc => ({
                id: doc.id,
                data: () => doc
              }))
            });
          }
        }),
        
        orderBy: () => ({
          limit: () => ({
            get: () => {
              const collection = getCollection();
              return Promise.resolve({
                docs: collection.slice(0, 10).map(doc => ({
                  id: doc.id,
                  data: () => doc
                }))
              });
            }
          })
        })
      };
    },
    
    doc: (path) => {
      const parts = path.split('/');
      const collectionName = parts[0];
      const docId = parts[1];
      
      return {
        get: () => {
          const collection = JSON.parse(localStorage.getItem(collectionName) || '[]');
          const doc = collection.find(item => item.id === docId);
          
          return Promise.resolve({
            exists: !!doc,
            data: () => doc
          });
        }
      };
    },
    
    serverTimestamp: () => new Date().toISOString()
  };
  
  export { auth, storage, db };