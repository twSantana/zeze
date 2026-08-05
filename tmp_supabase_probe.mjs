import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zygwuquveivwlzikpahk.supabase.co', 'sb_publishable_GWtY9D9gWzXtuK-ZzRWJTg_Z1cMbhse');

const run = async () => {
  try {
    console.log('Checking profiles access...');
    const profiles = await supabase.from('profiles').select('id').limit(1);
    console.log('profiles result:', JSON.stringify(profiles, null, 2));
  } catch (err) {
    console.error('profiles error', err);
  }
  try {
    console.log('Checking system_ping access...');
    const ping = await supabase.from('system_ping').select('id').limit(1);
    console.log('system_ping result:', JSON.stringify(ping, null, 2));
  } catch (err) {
    console.error('system_ping error', err);
  }
};
run();
