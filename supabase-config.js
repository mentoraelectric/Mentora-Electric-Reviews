import {
    createClient
} from '@supabase/supabase-js'

const supabaseUrl = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjenlqY2Vvc2llbGZtZGtwbGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTM0MTAsImV4cCI6MjA3NzU4OTQxMH0.Zy3_O4Eoqhbdgg0pKDwugDMcK_xt36uDO1Ek_WueWPQ'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)