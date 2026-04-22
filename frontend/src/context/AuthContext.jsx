import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [owner, setOwner] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // on app load — check if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem("trugoa_token");
    const savedOwner = localStorage.getItem("trugoa_owner");

    if (token && savedOwner) {
      setOwner(JSON.parse(savedOwner));
    }
    setAuthLoading(false);
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