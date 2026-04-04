import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAppSetting = (key: string) => {
  return useQuery({
    queryKey: ["app-setting", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? null;
    },
    staleTime: 1000 * 60 * 30, // cache 30 min
  });
};
