
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export interface UserFormData {
  email: string;
  password: string;
  username: string;
}

export function useUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('list-users', {
        method: 'GET'
      });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }

      return data;
    },
  });

  const createUser = async (userData: UserFormData) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData
      });

      if (error) throw error;

      toast({
        title: "Usuário criado com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
      return true;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário.",
      });
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<UserFormData>) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: { userId, ...userData }
      });

      if (error) throw error;

      toast({
        title: "Usuário atualizado com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao atualizar o usuário.",
      });
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;

      toast({
        title: "Usuário excluído com sucesso!",
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário.",
      });
      return false;
    }
  };

  return {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
  };
}
