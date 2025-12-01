import { supabase } from './database/supabaseClient';
import bycrypt from 'bcryptjs';

document.getElementById('Signup').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const hashed = bycrypt.hashSync(password, 10);

  const { data, error } = await supabase
    .from('User')
    .insert({ u_email: email, u_name: username, u_enc_password: hashed });

  if (error) {
    alert('Error Creating Account: ' + error.message);
  } else {
    alert('Account Created Successfully.');
    window.location.href = 'login.html';
  }
});
