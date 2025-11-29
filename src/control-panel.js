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
async function main() {
  // Getting data from supabase
  const data = await getDataByYearSource('Coal', 2001);

  // Get svg element
  const svg = d3.select('#main-svg');

  // Render it out with given data
  renderGraph(svg, data);
}

function renderGraph(svg, data) {
  // Initialize x axis
  const xDomain = data.map((d) => d.g_month);
  const xRange = [config.marginLeft, config.width - config.marginRight];
  const xScale = d3
    .scaleBand()
    .domain(xDomain)
    .range(xRange)
    .padding(config.padding);
  const xAxis = d3.axisBottom(xScale);

  // Adding x axis
  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0,${config.height - config.marginBottom})`)
    .call(xAxis);

  // Initialize y axis
  const yDomain = [0, d3.max(data.map((d) => d.sum))];
  const yRange = [config.height - config.marginBottom, config.marginTop];
  const yScale = d3.scaleLinear().domain(yDomain).range(yRange);
  const yAxis = d3.axisLeft(yScale);

  // Adding y axis
  svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${config.marginLeft},0)`)
    .call(yAxis);

  // Adding bars
  svg
    .append('g')
    .attr('fill', '#3EA3F0')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', (d) => xScale(d.g_month))
    .attr('y', (d) => yScale(d.sum))
    .attr('width', xScale.bandwidth())
    .attr('height', (d) => yScale(0) - yScale(d.sum));

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
