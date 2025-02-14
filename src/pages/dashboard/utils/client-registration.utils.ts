
import { supabase } from "@/lib/supabase";

export const fetchVisibleFields = async () => {
  try {
    const { data, error } = await supabase
      .from("client_registration_field_settings")
      .select("*")
      .eq('visible', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao carregar campos visíveis:", error);
    return [];
  }
};
