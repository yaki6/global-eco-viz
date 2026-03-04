import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 30, bottom: 40, left: 60 };

export default function LineChart({
  width, height, data, xKey = 'year', lines, crisisYears,
  xDomain, yDomain, yLabel, showLegend = true,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.length || !width) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = width - MARGIN.left - MARGIN.right;
    const h = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear()
      .domain(xDomain || d3.extent(data, d => d[xKey]))
      .range([0, w]);

    const allVals = lines.flatMap(l => data.map(d => d[l.key]).filter(v => v != null));
    const y = d3.scaleLinear()
      .domain(yDomain || [Math.min(0, d3.min(allVals)), d3.max(allVals) * 1.1])
      .range([h, 0]);

    // Crisis bands
    if (crisisYears && crisisYears.length) {
      crisisYears.forEach(yr => {
        g.append('rect')
          .attr('x', x(yr) - 1).attr('y', 0)
          .attr('width', Math.max(2, x(yr + 1) - x(yr)))
          .attr('height', h)
          .attr('fill', '#e53e3e').attr('opacity', 0.15);
      });
    }

    // Gridlines
    g.append('g').attr('class', 'grid')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(-h).tickFormat(''))
      .selectAll('line').attr('stroke', '#e2e8f0');

    // Axes
    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')));
    g.append('g').call(d3.axisLeft(y).ticks(6));

    if (yLabel) {
      g.append('text').attr('transform', 'rotate(-90)')
        .attr('y', -45).attr('x', -h / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#718096').attr('font-size', '12px')
        .text(yLabel);
    }

    // Lines
    lines.forEach((lineConfig) => {
      const lineData = data.filter(d => d[lineConfig.key] != null);
      const line = d3.line()
        .x(d => x(d[xKey]))
        .y(d => y(d[lineConfig.key]))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke', lineConfig.color || '#4a90b8')
        .attr('stroke-width', lineConfig.highlight ? 2.5 : 1.5)
        .attr('opacity', lineConfig.highlight ? 1 : 0.7)
        .attr('d', line);
    });

    // Legend
    if (showLegend && lines.length > 1) {
      const legend = g.append('g').attr('transform', `translate(${w - 150}, 0)`);
      lines.forEach((l, i) => {
        const row = legend.append('g').attr('transform', `translate(0, ${i * 18})`);
        row.append('line').attr('x1', 0).attr('x2', 20)
          .attr('stroke', l.color).attr('stroke-width', 2);
        row.append('text').attr('x', 25).attr('y', 4)
          .attr('font-size', '11px').attr('fill', '#4a5568')
          .text(l.label);
      });
    }
  }, [data, width, height, lines, crisisYears, xKey, xDomain, yDomain, yLabel, showLegend]);

  return <svg ref={svgRef} width={width} height={height} />;
}
