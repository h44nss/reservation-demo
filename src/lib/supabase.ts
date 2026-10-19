import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-kko-resto.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'mock-anon-key'

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    !supabaseUrl.includes('mock-kko-resto') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('mock-anon')
)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
