// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://zczyjceosielfmdkpldu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjenlqY2Vvc2llbGZtZGtwbGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTM0MTAsImV4cCI6MjA3NzU4OTQxMH0.Zy3_O4Eoqhbdgg0pKDwugDMcK_xt36uDO1Ek_WueWPQ';

// Create and export the Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
