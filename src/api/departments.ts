import { supabase } from '@/integrations/supabase/client';

export const fetchDepartments = async () => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};
