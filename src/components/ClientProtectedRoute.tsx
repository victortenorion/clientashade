
import { ReactNode, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface ClientProtectedRouteProps {
  children: ReactNode;
}

export const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  
  useEffect(() => {
    const storedClientId = localStorage.getItem('clientId');
    
    if (!storedClientId) {
      navigate('/client-login');
      return;
    }

    // Verificar se o clientId da URL corresponde ao armazenado
    if (storedClientId !== clientId) {
      navigate('/client-login');
      return;
    }
  }, [navigate, clientId]);

  return <>{children}</>;
};
