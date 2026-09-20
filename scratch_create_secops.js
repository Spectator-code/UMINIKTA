const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cuqqfogtrzvnvtovbnmg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXFmb2d0cnp2bnZ0b3Zibm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTI1MjcsImV4cCI6MjEwNTQyODUyN30.uIQpEewincQVdqskFf6TDNARhUTabGEwLlM2WdYMEYs'
);

async function checkUser() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'alkcabanatan@gmail.com',
    password: 'SecOpsAdmin2024!'
  });
  
  if (authErr) {
    console.log('Login failed:', authErr.message);
    return;
  }
  
  const { data, error } = await supabase.from('users').select('role, is_banned, profile_picture_url, cover_photo_url').eq('id', authData.user.id).single();
  console.log('Query with specific columns:', data, 'Error:', error?.message);
}

checkUser();
