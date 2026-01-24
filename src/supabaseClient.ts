import { createClient } from '@supabase/supabase-js';

// Seus dados reais baseados nas fotos que você mandou
const supabaseUrl = 'https://hksltlldhdgqfqxfmfjx.supabase.co';
const supabaseAnonKey = 'sb_publishable_R8OOfRtqw9K6AEcRGvojZA_FGhicg_G';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);