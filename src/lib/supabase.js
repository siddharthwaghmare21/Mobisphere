import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createDisabledQuery(table) {
  const response = Promise.resolve({ data: [], error: null, table })
  return {
    select: () => ({
      order: () => response,
      eq: () => response,
      then: response.then.bind(response),
      catch: response.catch.bind(response),
    }),
    insert: () => Promise.resolve({ data: null, error: null, table }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null, table }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null, table }),
    }),
  }
}

const disabledSupabase = {
  from: (table) => createDisabledQuery(table),
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : disabledSupabase
