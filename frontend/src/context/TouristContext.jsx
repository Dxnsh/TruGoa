import { createContext, useContext, useState, useEffect } from "react";

export const TouristContext= createContext(null);// ✅ export the context directly

export const TouristProvider = ({ children }) => {
  const [tourist, setTourist] = useState(null);
  const [touristLoading, setTouristLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("trugoa_tourist_token");
      const saved = localStorage.getItem("trugoa_tourist");
      if (token && saved) {
        setTourist(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load tourist session", e);
    } finally {
      setTouristLoading(false);
    }
  }, []);

  const touristLogin = (token, touristData) => {
    localStorage.setItem("trugoa_tourist_token", token);
    localStorage.setItem("trugoa_tourist", JSON.stringify(touristData));
    setTourist(touristData);
  };

  const touristLogout = () => {
    localStorage.removeItem("trugoa_tourist_token");
    localStorage.removeItem("trugoa_tourist");
    setTourist(null);
  };

  return (
    <TouristContext.Provider value={{
      tourist,
      touristLogin,
      touristLogout,
      touristLoading,
      isTouristLoggedIn: !!tourist,
    }}>
      {children}
    </TouristContext.Provider>
  );
};


export const useTourist = () => {
  const context = useContext(TouristContext);
  if (!context) {
    throw new Error("useTourist must be used inside TouristProvider");
  }
  return context;
};