const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://cuqqfogtrzvnvtovbnmg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXFmb2d0cnp2bnZ0b3Zibm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTI1MjcsImV4cCI6MjEwNTQyODUyN30.uIQpEewincQVdqskFf6TDNARhUTabGEwLlM2WdYMEYs'
);

async function testRLS() {
  try {
    const res = await fetch('https://ipapi.co/json/', { headers: { 'User-Agent': 'nodejs' }});
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.log('Error:', e.message);
  }
}

testRLS();
