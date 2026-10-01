import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isShahid: boolean;
  isShakeel: boolean;
  isViewer: boolean;
  canEditProducts: boolean;
  canEditPurchases: boolean;
  canEditStock: boolean;
  canEditExpenses: boolean;
  canEditSalaries: boolean;
  canEditFCA: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  isShahid: false,
  isShakeel: false,
  isViewer: false,
  canEditProducts: false,
  canEditPurchases: false,
  canEditStock: false,
  canEditExpenses: false,
  canEditSalaries: false,
  canEditFCA: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);

    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("auth-logout", handleLogout);
    return () => window.removeEventListener("auth-logout", handleLogout);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Role and Identity Checks
  const emailLower = user?.email?.toLowerCase() || "";
  const nameLower = user?.name?.toLowerCase() || "";
  const roleLower = user?.role?.toLowerCase() || "";

  // Shahid Khan is the Franchise Administrator / Incharge
  const isShahid = !!user && (emailLower.includes("shahid") || (roleLower === "admin" && !emailLower.includes("shakeel")));

  // Shakeel Ahmad is the FCA & Operations Officer
  const isShakeel = !!user && (emailLower.includes("shakeel") || nameLower.includes("shakeel") || nameLower.includes("shakil"));

  // Islam Badshah is the Franchise Owner (Audit & Read-Only Viewer)
  const isViewer = !!user && (roleLower === "viewer" || emailLower.includes("islambadshah"));

  // Permissions:
  // - Only Shahid Khan can add/edit/delete Products, Purchases, Stock adjustments, Expenses, Salaries, Settings
  // - Shakeel Ahmad and Shahid Khan can both edit and upload FCA Monthly Progress
  const canEditProducts = isShahid;
  const canEditPurchases = isShahid;
  const canEditStock = isShahid;
  const canEditExpenses = isShahid;
  const canEditSalaries = isShahid;
  const canEditFCA = isShahid || isShakeel;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isShahid,
        isShakeel,
        isViewer,
        canEditProducts,
        canEditPurchases,
        canEditStock,
        canEditExpenses,
        canEditSalaries,
        canEditFCA
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
