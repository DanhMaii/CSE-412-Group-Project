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

let year = 2001;
let source = 'Coal';
const svg = d3.select('#main-svg');
async function main() {
  // Setting up controller
  controllerSetup();

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

      renderWholeGraph(data, renderBarsOnSourceChange);
    }
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
    .attr('y', (d) => yScale(d.sum))
    .attr('height', (d) => Math.abs(yScale(d.sum) - yScale(0)));
  // .attr('height', (d) => yScale(0) - yScale(d.sum));
}

// Rendering bars on source change
function renderBarsOnSourceChange(data, xScale, yScale) {
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
    throw Error("Can't get data from getUser()");
  } else {
    return data;
  }
}

main();
