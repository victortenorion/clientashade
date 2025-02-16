
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";

export const ClientProtectedRoute = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      navigate('/client-login');
    }
  }, [navigate]);

  return <Outlet />;
};
