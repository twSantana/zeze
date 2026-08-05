import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://aubsxwtydswdthinchxh.supabase.co', 'sb_publishable_oIFw3FxvtwW0rsJw4XB4YQ_nibzIV5Z');

const run = async () => {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'TestPass123!';
  console.log('Signup test email:', email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome: 'Teste Signup',
        role: 'corretor'
      }
    }
  });

  console.log('RESULT', JSON.stringify({ data, error }, null, 2));
  if (error) process.exit(1);
  process.exit(0);
};

run();
