// Handle OAuth callback tokens from URL
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";

export function AuthHandler() {
  const { loginUser } = useApp();
  const [, navigate] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        console.log("[AUTH] Processing OAuth callback with token and user:", user);
        
        // Store token and user (same as login)
        loginUser(user, token, false);
        
        // Clean URL and redirect to dashboard
        window.history.replaceState({}, document.title, "/");
        navigate("/dashboard");
        
      } catch (error) {
        console.error("[AUTH] Failed to process OAuth callback:", error);
        navigate("/login");
      }
    }
  }, [loginUser, navigate]);

  return null; // This component doesn't render anything
}