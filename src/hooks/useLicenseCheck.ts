
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const useLicenseCheck = () => {
  const [isLicenseValid, setIsLicenseValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLicense = async () => {
      try {
        // Verificar se existe uma licença válida para este domínio
        const { data, error } = await supabase
          .from('licenses')
          .select('*')
          .eq('domain', window.location.hostname)
          .eq('is_active', true)
          .single();

        if (error) {
          throw error;
        }

        // Verificar se a licença está expirada
        const isExpired = new Date(data.expiration_date) < new Date();
        setIsLicenseValid(!isExpired);

        if (isExpired) {
          navigate('/license-expired');
        }
      } catch (error) {
        console.error('Erro ao verificar licença:', error);
        setIsLicenseValid(false);
        navigate('/license-required');
      } finally {
        setLoading(false);
      }
    };

    checkLicense();
  }, [navigate]);

  return { isLicenseValid, loading };
};
