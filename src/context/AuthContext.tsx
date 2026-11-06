import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInDemo: (doctorName?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_STORAGE_KEY = "clinical_clarity_demo_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DEMO_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // Ignore
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        try {
          localStorage.removeItem(DEMO_STORAGE_KEY);
        } catch {
          // Ignore
        }
      } else {
        try {
          const saved = localStorage.getItem(DEMO_STORAGE_KEY);
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed", error);
      throw error;
    }
  };

  const signInDemo = (doctorName = "Dr. Smith") => {
    const demoUser = {
      uid: "doc-smith-001",
      displayName: doctorName,
      email: "dr.smith@clinic.org",
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;
    setUser(demoUser);
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
    } catch {
      // Ignore
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setUser(null);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInDemo, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
