
import { ReactNode, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClientAuth } from "@/hooks/useClientAuth";

interface ClientProtectedRouteProps {
  children: ReactNode;
}

export const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { checkAuth } = useClientAuth();
  
  useEffect(() => {
    if (!checkAuth(clientId)) {
      navigate('/client-login');
    }
  }, [clientId, navigate, checkAuth]);

  return <>{children}</>;
};
