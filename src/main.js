import './style.css';
import { supabase } from './database/supabaseClient';

// Example: Fetch data
async function getUser() {
  const { data, error } = await supabase.from('Test_Table').select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
  }
}

getUser();
