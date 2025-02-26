
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export interface UserFormData {
  email: string;
  password: string;
  username: string;
  is_admin?: boolean;
  store_ids?: string[];
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
        toast({
          variant: "destructive",
          title: "Erro ao carregar usuários",
          description: error.message
        });
        throw error;
      }

      // Fetch admin status for each user
      const usersWithRoles = await Promise.all(
        data.map(async (user: any) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('is_admin')
            .eq('user_id', user.id)
            .single();
            
          return {
            ...user,
            is_admin: roleData?.is_admin || false
          };
        })
      );

      return usersWithRoles;
    },
  });

  const createUser = async (userData: UserFormData) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData
      });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        toast({
          variant: "destructive",
          title: "Erro ao criar usuário",
          description: error.message || "Ocorreu um erro ao criar o usuário."
        });
        return false;
      }

      // Create store assignment if store_ids is provided
      if (userData.store_ids && userData.store_ids.length > 0) {
        const { error: storeError } = await supabase
          .from('user_stores')
          .insert({
            user_id: data.id,
            store_id: userData.store_ids[0]
          });

        if (storeError) {
          console.error('Erro ao associar loja:', storeError);
          toast({
            variant: "destructive",
            title: "Erro ao associar loja",
            description: storeError.message
          });
          return false;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stores'] });
      return true;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário."
      });
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<UserFormData>) => {
    try {
      const { error } = await supabase.functions.invoke('update-user', {
        body: { userId, ...userData }
      });

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar usuário",
          description: error.message
        });
        return false;
      }

      // Update store assignment if store_ids is provided
      if (userData.store_ids) {
        // First delete existing assignments
        await supabase
          .from('user_stores')
          .delete()
          .eq('user_id', userId);

        // Then create new assignment if a store is selected
        if (userData.store_ids.length > 0) {
          const { error: storeError } = await supabase
            .from('user_stores')
            .insert({
              user_id: userId,
              store_id: userData.store_ids[0]
            });

          if (storeError) {
            console.error('Erro ao atualizar loja:', storeError);
            toast({
              variant: "destructive",
              title: "Erro ao atualizar loja",
              description: storeError.message
            });
            return false;
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stores'] });
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao atualizar o usuário."
      });
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) {
        console.error('Erro ao excluir usuário:', error);
        toast({
          variant: "destructive",
          title: "Erro ao excluir usuário",
          description: error.message || "Ocorreu um erro ao excluir o usuário."
        });
        return false;
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stores'] });
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário."
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
