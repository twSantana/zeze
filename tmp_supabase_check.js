const { createClient } = require('./node_modules/@supabase/supabase-js');
const supabase = createClient('https://aubsxwtydswdthinchxh.supabase.co', 'sb_publishable_oIFw3FxvtwW0rsJw4XB4YQ_nibzIV5Z');

(async () => {
  try {
    const policies = await supabase.rpc('sql', { sql: "SELECT policyname, tablename, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'profiles'" });
    console.log('POLICIES:', JSON.stringify(policies, null, 2));
  } catch (e) {
    console.error('POLICIES ERROR', e);
  }
  try {
    const funcs = await supabase.rpc('sql', { sql: "SELECT proname, prosrc FROM pg_proc WHERE proname IN ('is_gerente_ou_master','is_master_user','handle_new_user')" });
    console.log('FUNCS:', JSON.stringify(funcs, null, 2));
  } catch (e) {
    console.error('FUNCS ERROR', e);
  }
  try {
    const profilesSel = await supabase.from('profiles').select('id').limit(1);
    console.log('PROFILES SELECT:', JSON.stringify(profilesSel, null, 2));
  } catch (e) {
    console.error('PROFILES SELECT ERROR', e);
  }
})();
