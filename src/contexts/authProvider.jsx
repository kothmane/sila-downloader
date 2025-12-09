import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import auth from '@/services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as signOutFirebase } from 'firebase/auth';
import { operation } from '@/utils/helper';
import { useNavigate } from 'react-router';

const AuthContext = createContext();




const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const firstFirebaseAuthLoading = useRef(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (firstFirebaseAuthLoading.current) {
          if (user) {
            await getAdminData(user);
          } else {
            setAdmin(null);
            setFirebaseUser(null);
          }
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setAuthLoading(false);
        firstFirebaseAuthLoading.current = false;
      }
    });

    return () => unsubscribe();
  }, []);


  const signIn = useCallback(async (email, password) => {
    if (admin) {
      setError("Already signed in");
      return null;
    }
    setError(null);
    setAuthLoading(true);
    let firebaseResponse;
    try {
      firebaseResponse = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      let message;
      // See: https://firebase.google.com/docs/reference/js/auth#autherrorcodes
      switch (error.code) {
        case "auth/invalid-email":
          message = "Invalid email";
          break;
        case "auth/invalid-credential":
        case "auth/wrong-password":
          message = "Invalid email or password";
          break;
        case "auth/user-not-found":
          message = "User not found";
          break;
        case "auth/too-many-requests":
          message = "Too many requests. Please try again later.";
          break;
        default:
          message = "An error occurred";
          break;
      }

      setError(message);
      setAuthLoading(false);
      return null;
    }
    
    try {
      const adminData = await getAdminData(firebaseResponse.user);
      setAuthLoading(false);
      return adminData;
    } catch (error) {
      setAuthLoading(false);
      setError(error.message);
      setFirebaseUser(null);
      return null;
    }
  }, [firebaseUser, admin]);

  const signOut = useCallback(async () => {
    await signOutFirebase(auth);
    setAdmin(null);
    setFirebaseUser(null);
    setError(null);
  }, []);

  const getAdminData = useCallback(async (user) => {
    setFirebaseUser(user);
    const id_token = await user.getIdToken();
    const adminData = await operation({collection: 'admin', name: 'getMyData', static_operation: true, token: id_token});
    if (adminData.ok) {
      setAdmin(adminData.data);
      return adminData.data;
    } else {
      if (adminData.error) {
        throw new Error(adminData.error);
      } else {
        throw new Error("A server error occurred");
      }
    }
  }, [])

  const adminHasRole = useCallback((role) => {
    if (!admin) return false;
    if (admin.roles.includes("super_admin")) return true;
    if (admin.roles.includes(role)) return true;
    return false;
  }, [admin]);


  const value = useMemo(() => ({ firebaseUser, authLoading, admin, signIn, signOut, error, adminHasRole, firstFirebaseAuthLoading }), [firebaseUser, authLoading, admin, signIn, signOut, error, adminHasRole, firstFirebaseAuthLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };