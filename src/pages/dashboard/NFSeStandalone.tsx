
import React from 'react';
import { NFSeForm } from './components/NFSeForm';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { NFSeFormData } from './types/nfse.types';

export const NFSeStandalone = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (formData: NFSeFormData) => {
    try {
      const { error } = await supabase
        .from('nfse')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "NFS-e criada com sucesso",
        description: "A nota fiscal foi salva e está aguardando processamento."
      });

      navigate('/dashboard/service-orders');
    } catch (error: any) {
      toast({
        title: "Erro ao criar NFS-e",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/service-orders');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Nova NFS-e</h2>
      </div>
      <NFSeForm 
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText="Criar NFS-e"
      />
    </div>
  );
};
