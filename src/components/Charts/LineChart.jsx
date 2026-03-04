import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 30, bottom: 40, left: 60 };

export default function LineChart({
  width, height, data, xKey = 'year', lines, crisisYears,
  xDomain, yDomain, yLabel, showLegend = true, onTooltip,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!width) return;
    // Allow rendering when per-line data is used even if shared data is empty
    const hasAnyData = (data && data.length) || lines.some(l => l.data && l.data.length);
    if (!hasAnyData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = width - MARGIN.left - MARGIN.right;
    const h = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Resolve per-line datasets
    const resolvedData = lines.map(l => l.data || data || []);

    // X domain: union across all per-line datasets
    const allXVals = resolvedData.flatMap(d => d.map(row => row[xKey]).filter(v => v != null));
    const x = d3.scaleLinear()
      .domain(xDomain || d3.extent(allXVals))
      .range([0, w]);

    // Y domain: iterate per-line datasets
    const allVals = lines.flatMap((l, i) =>
      resolvedData[i].map(d => d[l.key]).filter(v => v != null)
    );
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
          .attr('fill', '#d35f5f').attr('opacity', 0.15);
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

    // Lines with per-line data support
    lines.forEach((lineConfig, i) => {
      const lineData = resolvedData[i].filter(d => d[lineConfig.key] != null);
      const line = d3.line()
        .x(d => x(d[xKey]))
        .y(d => y(d[lineConfig.key]))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke', lineConfig.color || '#0072B2')
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

    // Tooltip overlay with bisector
    // Use the primary dataset (first line with data, or shared data) for bisecting
    const primaryData = resolvedData[0] || data || [];
    // Build a merged year map for tooltip: year -> { lineIdx: value }
    const yearMap = new Map();
    resolvedData.forEach((rd, li) => {
      rd.forEach(d => {
        const yr = d[xKey];
        if (!yearMap.has(yr)) yearMap.set(yr, { [xKey]: yr });
        yearMap.get(yr)[`__line_${li}`] = d[lines[li].key];
      });
    });
    const mergedYears = Array.from(yearMap.values()).sort((a, b) => a[xKey] - b[xKey]);

    const bisect = d3.bisector(d => d[xKey]).left;
    const focusLine = g.append('line')
      .attr('stroke', '#718096').attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0).attr('y2', h)
      .style('display', 'none');

    const focusDots = lines.map(l =>
      g.append('circle')
        .attr('r', 4).attr('fill', l.color || '#0072B2')
        .attr('stroke', '#fff').attr('stroke-width', 1.5)
        .style('display', 'none')
    );

    const tooltipG = g.append('g').style('display', 'none');
    const tooltipBg = tooltipG.append('rect')
      .attr('fill', 'white').attr('stroke', '#e2e8f0')
      .attr('rx', 4).attr('opacity', 0.95);
    const tooltipText = tooltipG.append('text')
      .attr('font-size', '11px').attr('fill', '#1a202c');

    g.append('rect')
      .attr('width', w).attr('height', h)
      .attr('fill', 'transparent')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const xVal = x.invert(mx);
        const idx = bisect(mergedYears, xVal, 1);
        const d0 = mergedYears[idx - 1];
        const d1 = mergedYears[idx];
        if (!d0) return;
        const d = d1 && (xVal - d0[xKey] > d1[xKey] - xVal) ? d1 : d0;
        const xPos = x(d[xKey]);

        focusLine.attr('x1', xPos).attr('x2', xPos).style('display', null);
        focusDots.forEach((dot, i) => {
          const val = d[`__line_${i}`];
          if (val != null) {
            dot.attr('cx', xPos).attr('cy', y(val)).style('display', null);
          } else {
            dot.style('display', 'none');
          }
        });

        // Build tooltip text
        tooltipG.style('display', null);
        tooltipText.selectAll('tspan').remove();
        tooltipText.append('tspan')
          .attr('x', 8).attr('dy', 14).attr('font-weight', 'bold')
          .text(d[xKey]);
        lines.forEach((l, i) => {
          const val = d[`__line_${i}`];
          if (val != null) {
            tooltipText.append('tspan')
              .attr('x', 8).attr('dy', 14).attr('fill', l.color)
              .text(`${l.label}: ${val.toFixed(3)}`);
          }
        });

        const bbox = tooltipText.node().getBBox();
        tooltipBg.attr('width', bbox.width + 16).attr('height', bbox.height + 8)
          .attr('y', bbox.y - 4);
        // Find first valid value for Y positioning
        let firstValidY = h / 2;
        for (let i = 0; i < lines.length; i++) {
          const val = d[`__line_${i}`];
          if (val != null) { firstValidY = y(val); break; }
        }
        const tipX = xPos + 15 > w - bbox.width - 20 ? xPos - bbox.width - 30 : xPos + 15;
        tooltipG.attr('transform', `translate(${tipX}, ${Math.max(0, firstValidY - 30)})`);
      })
      .on('mouseout', function() {
        focusLine.style('display', 'none');
        focusDots.forEach(dot => dot.style('display', 'none'));
        tooltipG.style('display', 'none');
      });

  }, [data, width, height, lines, crisisYears, xKey, xDomain, yDomain, yLabel, showLegend]);

  return <svg ref={svgRef} width={width} height={height} />;
}
