// supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://zczyjceosielfmdkpldu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjenlqY2Vvc2llbGZtZGtwbGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTM0MTAsImV4cCI6MjA3NzU4OTQxMH0.Zy3_O4Eoqhbdgg0pKDwugDMcK_xt36uDO1Ek_WueWPQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
