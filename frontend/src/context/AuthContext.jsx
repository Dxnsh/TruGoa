import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [owner, setOwner] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // on app load — check if token exists in localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem("trugoa_token");
      const savedOwner = localStorage.getItem("trugoa_owner");

      if (token && savedOwner) {
        setOwner(JSON.parse(savedOwner));
      }
    } catch (e) {
      // A truncated or malformed trugoa_owner used to throw straight out of
      // this effect. AuthProvider wraps the whole tree, and there was no error
      // boundary above it, so the page went blank for good — the visitor had no
      // way back short of clearing site data by hand.
      //
      // The pair is dropped rather than just logged: leaving the bad value in
      // place means every reload lands here again. Signing in writes a fresh,
      // valid pair, so the worst case is being signed out once.
      console.error("Failed to load owner session — clearing it", e);
      localStorage.removeItem("trugoa_token");
      localStorage.removeItem("trugoa_owner");
      setOwner(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = (token, ownerData) => {
    localStorage.setItem("trugoa_token", token);
    localStorage.setItem("trugoa_owner", JSON.stringify(ownerData));
    setOwner(ownerData);
  };

  const logout = () => {
    localStorage.removeItem("trugoa_token");
    localStorage.removeItem("trugoa_owner");
    setOwner(null);
  };

  return (
    <AuthContext.Provider value={{ owner, login, logout, authLoading, isLoggedIn: !!owner }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook — use this anywhere in the app
export const useAuth = () => useContext(AuthContext);