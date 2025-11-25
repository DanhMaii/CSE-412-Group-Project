import './style.css';
import { supabase } from './database/supabaseClient';
import * as d3 from 'd3';

// Starting point
async function main() {
  // Example: get user table from supabase, then use d3 to display the corresponding table
  // Get data here
  const data = await getUser();

  // Get html element with id: app
  const app = d3.select('#app');

  // Style h1 inside app, color green
  app.select('h1').style('color', 'green');

  // Create table
  const table = app.append('table');

  // Declare header
  const header = ['id', 'created_at', 'name'];

  // Create header
  table
    .append('thead')
    .append('tr')
    .selectAll('th')
    .data(header)
    .join('th')
    .text((h) => h)
    .style('border', '1px solid black')
    .style('padding', '5px 10px')
    .style('font-weight', 'bold');

  // Create body (rows)
  const rows = table.append('tbody').selectAll('tr').data(data).join('tr');
  rows
    .append('td')
    .text((d) => d.id)
    .style('border', '1px solid black')
    .style('padding', '5px 10px');
  rows
    .append('td')
    .text((d) => d.created_at)
    .style('border', '1px solid black')
    .style('padding', '5px 10px');
  rows
    .append('td')
    .text((d) => d.name)
    .style('border', '1px solid black')
    .style('padding', '5px 10px');
}

// Example: Fetch data
async function getUser() {
  const { data, error } = await supabase.from('Test_Table').select('*');

  if (error) {
    throw Error("Can't get data from getUser()");
  } else {
    return data;
  }
}

// DON'T EDIT BELOW
main();
