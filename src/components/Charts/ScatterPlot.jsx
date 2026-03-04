import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };

export default function ScatterPlot({
  width, height, data, xKey, yKey, xLabel, yLabel,
  colorKey, colorScale, radiusKey, showTrend = false, labelKey,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.length || !width) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = width - MARGIN.left - MARGIN.right;
    const h = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const filtered = data.filter(d => d[xKey] != null && d[yKey] != null);

    const x = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d[xKey])).nice()
      .range([0, w]);
    const y = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d[yKey])).nice()
      .range([h, 0]);

    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(8));
    g.append('g').call(d3.axisLeft(y).ticks(6));

    if (xLabel) {
      g.append('text').attr('x', w / 2).attr('y', h + 40)
        .attr('text-anchor', 'middle').attr('fill', '#718096')
        .attr('font-size', '12px').text(xLabel);
    }
    if (yLabel) {
      g.append('text').attr('transform', 'rotate(-90)')
        .attr('y', -45).attr('x', -h / 2)
        .attr('text-anchor', 'middle').attr('fill', '#718096')
        .attr('font-size', '12px').text(yLabel);
    }

    // Tooltip
    const tooltipG = g.append('g').style('display', 'none');
    const tooltipBg = tooltipG.append('rect')
      .attr('fill', 'white').attr('stroke', '#e2e8f0').attr('rx', 4).attr('opacity', 0.95);
    const tooltipText = tooltipG.append('text')
      .attr('font-size', '11px').attr('fill', '#1a202c');

    // Dots with join pattern
    g.selectAll('.dot')
      .data(filtered)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d[xKey]))
      .attr('cy', d => y(d[yKey]))
      .attr('r', d => radiusKey ? Math.max(2, Math.sqrt(d[radiusKey]) * 2) : 4)
      .attr('fill', d => colorKey && colorScale ? colorScale(d[colorKey]) : '#0072B2')
      .attr('opacity', 0.6)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 7).attr('opacity', 1);
        tooltipG.style('display', null);
        tooltipText.selectAll('tspan').remove();
        if (labelKey && d[labelKey]) {
          tooltipText.append('tspan')
            .attr('x', 8).attr('dy', 14).attr('font-weight', 'bold')
            .text(d[labelKey]);
        }
        if (d.year) {
          tooltipText.append('tspan')
            .attr('x', 8).attr('dy', 14).attr('font-weight', 'bold')
            .text(`Year: ${d.year}`);
        }
        tooltipText.append('tspan')
          .attr('x', 8).attr('dy', 14)
          .text(`${xLabel || xKey}: ${d[xKey].toFixed(2)}`);
        tooltipText.append('tspan')
          .attr('x', 8).attr('dy', 14)
          .text(`${yLabel || yKey}: ${d[yKey].toFixed(2)}`);
        const bbox = tooltipText.node().getBBox();
        tooltipBg.attr('width', bbox.width + 16).attr('height', bbox.height + 8)
          .attr('y', bbox.y - 4);
        const tipX = x(d[xKey]) + 15 > w - bbox.width - 20
          ? x(d[xKey]) - bbox.width - 30
          : x(d[xKey]) + 15;
        tooltipG.attr('transform', `translate(${tipX}, ${y(d[yKey]) - 20})`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', d => radiusKey ? Math.max(2, Math.sqrt(d[radiusKey]) * 2) : 4)
          .attr('opacity', 0.6);
        tooltipG.style('display', 'none');
      });

    // Trend line
    if (showTrend && filtered.length > 5) {
      const xMean = d3.mean(filtered, d => d[xKey]);
      const yMean = d3.mean(filtered, d => d[yKey]);
      const num = d3.sum(filtered, d => (d[xKey] - xMean) * (d[yKey] - yMean));
      const den = d3.sum(filtered, d => (d[xKey] - xMean) ** 2);
      const slope = num / den;
      const intercept = yMean - slope * xMean;
      const xExt = d3.extent(filtered, d => d[xKey]);

      g.append('line')
        .attr('x1', x(xExt[0])).attr('y1', y(intercept + slope * xExt[0]))
        .attr('x2', x(xExt[1])).attr('y2', y(intercept + slope * xExt[1]))
        .attr('stroke', '#d35f5f').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,3').attr('opacity', 0.7);
    }
  }, [data, width, height, xKey, yKey, xLabel, yLabel, colorKey, colorScale, radiusKey, showTrend, labelKey]);

  return <svg ref={svgRef} width={width} height={height} />;
}
