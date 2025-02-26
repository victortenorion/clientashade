
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
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Erro ao buscar usuários:', authError);
        throw authError;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      const mergedUsers = authUsers.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        return {
          id: user.id,
          email: user.email,
          username: profile?.username || user.email?.split('@')[0],
          updated_at: profile?.updated_at || user.updated_at,
          last_sign_in_at: user.last_sign_in_at,
        };
      });

      return mergedUsers;
    },
  });

  const createUser = async (userData: UserFormData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          username: userData.username,
          email: userData.email,
        });

      if (profileError) throw profileError;

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
      if (userData.email || userData.password) {
        const updates: { email?: string; password?: string } = {};
        if (userData.email) updates.email = userData.email;
        if (userData.password) updates.password = userData.password;

        const { error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          updates
        );

        if (authError) throw authError;
      }

      if (userData.username || userData.email) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            username: userData.username,
            email: userData.email,
          });

        if (profileError) throw profileError;
      }

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
      const { error } = await supabase
        .rpc('delete_user', { user_id: userId });

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
