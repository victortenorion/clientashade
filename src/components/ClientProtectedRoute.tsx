
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ClientProtectedRouteProps {
  children: ReactNode;
}

export const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      navigate('/client-login');
    }
  }, [navigate]);

  return <>{children}</>;
};
