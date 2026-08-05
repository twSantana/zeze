import { createClient } from './node_modules/@supabase/supabase-js/dist/main/index.js';
const supabase = createClient('https://aubsxwtydswdthinchxh.supabase.co', 'sb_publishable_oIFw3FxvtwW0rsJw4XB4YQ_nibzIV5Z');

const inspect = async () => {
  try {
    const sqlPolicies = "SELECT policyname, tablename, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'profiles'";
    const policiesResp = await supabase.rpc('sql', { sql: sqlPolicies });
    console.log('POLICIES RESP:', JSON.stringify(policiesResp, null, 2));
  } catch (e) {
    console.error('POLICIES ERROR', e);
  }
  try {
    const sqlFuncs = "SELECT proname, prosrc FROM pg_proc WHERE proname IN ('is_gerente_ou_master','is_master_user','handle_new_user')";
    const funcsResp = await supabase.rpc('sql', { sql: sqlFuncs });
    console.log('FUNCS RESP:', JSON.stringify(funcsResp, null, 2));
  } catch (e) {
    console.error('FUNCS ERROR', e);
  }
  try {
    const sel = await supabase.from('profiles').select('id').limit(1);
    console.log('PROFILES SELECT:', JSON.stringify(sel, null, 2));
  } catch (e) {
    console.error('PROFILES SELECT ERROR', e);
  }
};
inspect();
