import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserContextType {
  user: UserInfo | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);

  async function refreshUser() {
    try {
      const data = await apiFetch<UserInfo>("/me");
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
