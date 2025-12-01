import { supabase } from './database/supabaseClient';
import * as d3 from 'd3';

// Global graph config
const config = {
  width: 1200,
  height: 500,
  marginTop: 40,
  marginRight: 40,
  marginBottom: 30,
  marginLeft: 120,
  fontSize: 16,
  padding: 0.5,
};
let userId = localStorage.getItem('user_uid');
let personalQueryExist = null;
console.log('User ID from login:', userId);

let year = 2001;
let source = 'Coal';
const svg = d3.select('#main-svg');
async function main() {
  // Setting up controller
  controllerSetup();
  try {
    const { sq_filter_criteria } = await getSavedQuery(userId);
    personalQueryExist = true;
    year = sq_filter_criteria?.year;
    source = sq_filter_criteria?.source;
    document.getElementById('year-selector').value = year;
    document.getElementById('energy-source').value = source;
  } catch (e) {
    console.log(e);
  }
  // Getting data from supabase
  const data = await getDataByYearSource(source, year);

  // Render it out with given data
  renderWholeGraph(data, renderBarsInitial);
}

// Setting up handlers
function controllerSetup() {
  // Add handler when DOM Content is loaded
  document.addEventListener('DOMContentLoaded', () => {
    document
      .getElementById('energy-source')
      .addEventListener('change', (e) =>
        energySourceChangeHandler(e.target.value)
      );

    // Function to handle the energy source change
    async function energySourceChangeHandler(newSource) {
      // Update global variable: source
      source = newSource;

      // Get new data
      const data = await getDataByYearSource(newSource, year);

      renderWholeGraph(data, renderBarsOnChange);
    }
    document
      .getElementById('year-selector')
      .addEventListener('change', (e) => yearChangeHandler(e.target.value));

    // Function to handle the energy source change
    async function energySourceChangeHandler(newSource) {
      console.log('Changed');
      // Update global variable: source
      source = newSource;

      // Get new data
      const data = await getDataByYearSource(newSource, year);

      renderWholeGraph(data, renderBarsOnChange);
    }

    async function yearChangeHandler(newYear) {
      const prevYear = year;
      // Update global variable: year
      year = +newYear;

      // Get new data
      const data = await getDataByYearSource(source, +newYear);
      if (prevYear === 2022) {
        renderWholeGraph(data, renderBarsInitial);
        return;
      }
      renderWholeGraph(data, renderBarsOnChange);
    }

    document
      .getElementById('save-query')
      .addEventListener('click', (e) => saveCurrentStateHandler());
    async function saveCurrentStateHandler() {
      console.log('clicked on save');
      if (!personalQueryExist) {
        addQuery(userId, { year, source });
        personalQueryExist = true;
      } else {
        updateSavedQuery(userId, { year, source });
      }
    }
    //delete account button handler
    document
      .getElementById('deleteAcctBtn')
      .addEventListener('click', async (e) => {
        e.preventDefault();

        const confirmDelete = confirm(
          'Are you sure you want to delete your account?'
        );
        if (!confirmDelete) {
          return;
        }

        const { error } = await supabase
          .from('User')
          .delete()
          .eq('u_user_id', user_id);

        if (error) {
          alert('Error deleting account: ' + error.message);
        } else {
          alert('Your account has been deleted.');
          localStorage.removeItem('user_id');
          window.location.href = 'login.html';
        }
      });
  });
}

// Main graph rendering
function renderWholeGraph(data, renderBarsCallback) {
  // Initialize x axis
  const xDomain = data.map((d) => d.g_month);
  const xRange = [config.marginLeft, config.width - config.marginRight];
  const xScale = d3
    .scaleBand()
    .domain(xDomain)
    .range(xRange)
    .padding(config.padding);
  const xAxis = d3.axisBottom(xScale);

  // Try to remove old x-axis before adding
  const oldXAxis = svg.select('#x-axis');
  if (!oldXAxis.empty()) {
    oldXAxis.remove();
  }
  // Adding x axis
  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0,${config.height - config.marginBottom})`)
    .call(xAxis);

  // Initialize y axis
  // const yDomain = [0, d3.max(data.map((d) => d.sum))];
  const yDomain = [
    Math.min(0, d3.min(data.map((d) => d.sum))),
    Math.max(0, d3.max(data.map((d) => d.sum))),
  ];
  console.log(yDomain);
  const yRange = [config.height - config.marginBottom, config.marginTop];
  const yScale = d3.scaleLinear().domain(yDomain).range(yRange);
  const yAxis = d3.axisLeft(yScale);

  // Try to remove old y-axis before adding
  const oldYAxis = svg.select('#y-axis');
  if (!oldYAxis.empty()) {
    oldYAxis.remove();
  }

  // Adding y axis
  svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${config.marginLeft},0)`)
    .call(yAxis);

  // Adding x label if there is no x label
  if (svg.select('#x-label').empty()) {
    svg
      .append('text')
      .attr('id', 'x-label')
      .attr('x', config.width / 2)
      .attr('y', config.height + config.marginBottom / 2)
      .style('font-weight', 'bold')
      .style('font-size', config.fontSize)
      .text('Month');
  }

  // Adding y label if there is no y label
  if (svg.select('#y-label').empty()) {
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('id', 'y-label')
      .attr('x', -config.height / 2)
      .attr('y', config.fontSize + 15)
      .attr('transform', 'rotate(-90)')
      .style('font-weight', 'bold')
      .style('font-size', config.fontSize)
      .text('Amount');
  }

  // Adding title if there is no title
  if (svg.select('#title-label').empty()) {
    svg
      .append('text')
      .attr('id', 'title-label')
      .attr('text-anchor', 'middle')

      .attr('x', config.width / 2)
      .attr('y', config.marginTop / 2 - config.fontSize)
      .style('font-weight', 'bold')
      .style('font-size', config.fontSize * 1.1)
      .text(`Energy Generation from ${source} in the U.S. - ${year}`);
  }

  renderBarsCallback(data, xScale, yScale);
}

// First time rendering bars
function renderBarsInitial(data, xScale, yScale) {
  // Adding bars
  const bars = svg
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('fill', '#3EA3F0')
    .attr('x', (d) => xScale(d.g_month))
    .attr('y', yScale(0))
    .attr('width', xScale.bandwidth())
    .attr('height', 0);

  // Adding transition to the bars
  bars
    .transition()
    .duration(1000)
    .attr('y', (d) => yScale(d.sum >= 0 ? d.sum : 0))
    .attr('height', (d) => Math.abs(yScale(d.sum) - yScale(0)));
  // .attr('height', (d) => yScale(0) - yScale(d.sum));
}

// Rendering bars on source change
function renderBarsOnChange(data, xScale, yScale) {
  // Adding bars
  const bars = svg
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('fill', '#3EA3F0')
    .attr('x', (d) => xScale(d.g_month))
    .attr('width', xScale.bandwidth());

  // Adding transition to the bars
  bars
    .transition()
    .duration(1000)
    .attr('y', (d) => yScale(d.sum >= 0 ? d.sum : 0))
    .attr('height', (d) => {
      return Math.abs(yScale(0) - yScale(d.sum));
    });
}

// Get generation amount from a chosen source at chosen year in 12 months
async function getDataByYearSource(source, year) {
  const { data, error } = await supabase
    .from('Generation_Record')
    .select('g_month, g_generation_amount_MWh.sum()')
    .eq('g_energy_source', source)
    .eq('g_year', year)
    .neq('g_energy_source', 'Total');
  if (error) {
    throw Error("Can't get data from getDataByYearSource()");
  } else {
    return data;
  }
}
// Get saved query
async function getSavedQuery(userId) {
  const { data, error } = await supabase
    .from('Saved_Query')
    .select('sq_filter_criteria')
    .eq('sq_user_id', userId)
    .single();

  if (error) {
    throw Error("Can't get data from getSavedQuery()");
  } else {
    return data;
  }
}
// Insert saved query
async function addQuery(userId, savedQueryJson) {
  const { data, error } = await supabase.from('Saved_Query').insert({
    sq_user_id: userId,
    sq_name: userId + new Date(),
    sq_filter_criteria: savedQueryJson,
  });

  if (error) {
    throw Error("Can't get data from addQuery()");
  } else {
    return data;
  }
}
// Update saved query
async function updateSavedQuery(userId, newSavedQueryJson) {
  const { data, error } = await supabase
    .from('Saved_Query')
    .update({
      sq_filter_criteria: newSavedQueryJson,
    })
    .eq('sq_user_id', userId);

  if (error) {
    throw Error("Can't get data from updateSavedQuery()");
  } else {
    return data;
  }
}
main();
