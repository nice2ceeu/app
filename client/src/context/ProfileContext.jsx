import { createContext, useContext, useEffect, useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const r = await fetch(`${API_URL}/profile`, { credentials: "include" });
        const data = r.ok ? await r.json() : null;
        return setProfile(data);
      } catch {
        return setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, setProfile, refetchProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);