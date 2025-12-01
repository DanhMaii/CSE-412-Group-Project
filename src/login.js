import { supabase } from './database/supabaseClient';
import bycrypt from 'bcryptjs';

if (localStorage.getItem('user_id')) {
  window.location.href = 'control-panel.html';
}
document.getElementById('submitBtn').addEventListener('click', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('u_email', email);

  if (error) {
    alert('Error Logging In: ' + error.message);
  }

  if (data.length === 0 || !data) {
    alert('Invalid email or password.');
  }

  const user = data[0];
  const match = bycrypt.compareSync(password, user.u_enc_password);

  if (!match) {
    alert('Invalid email or password.');
  } else {
    localStorage.setItem('user_id', user.u_user_id);
    window.location.href = 'control-panel.html';
  }
});
