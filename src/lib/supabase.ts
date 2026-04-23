import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabaseConfigured =
  !!url && !!anonKey && !url.includes("YOUR_PROJECT") && !anonKey.includes("YOUR_ANON_KEY");

export const supabase = createClient(
  supabaseConfigured ? url : "https://placeholder.supabase.co",
  supabaseConfigured ? anonKey : "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "nova-nurox-auth",
    },
  },
);

export type Signup = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  city: string | null;
  paid: boolean;
  created_at: string;
};
