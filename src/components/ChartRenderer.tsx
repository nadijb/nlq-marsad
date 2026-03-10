'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { ChartData } from '@/types/chat'

interface ChartRendererProps {
  chartType: string
  data: ChartData
}

const COLORS = [
  '#13285a',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#16a34a',
  '#0891b2',
  '#4f46e5',
  '#c026d3',
  '#059669',
]

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
}

export default function ChartRenderer({ chartType, data }: ChartRendererProps) {
  const xKey = data.xKey || data.xAxisKey || data.nameKey || ''
  const yKey = data.yKey || data.yAxisKey || data.valueKey || ''
  const zKey = data.zKey || ''

  const chartData = data.values.map((item) => {
    const processed: Record<string, string | number> = {}
    Object.keys(item).forEach((key) => {
      const value = item[key]
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      processed[key] = isNaN(numValue) ? value : numValue
    })
    return processed
  })

  // ── StatisticCard ────────────────────────────────────────────────────────────
  if (chartType === 'StatisticCard') {
    return (
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
        {chartData.map((item, index) => {
          const value = item[yKey] ?? item.value
          const label = item[xKey] ?? item.label ?? `Metric ${index + 1}`
          const unit = data.unit ?? item.unit ?? ''
          const change = item.change
          const trend = item.trend
          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-1"
            >
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">
                {String(label)}
              </p>
              <p className="text-3xl font-bold text-primary">
                {typeof value === 'number' ? value.toLocaleString() : value}
                {unit ? (
                  <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
                ) : null}
              </p>
              {change ? (
                <p
                  className={`text-xs font-medium ${
                    trend === 'up'
                      ? 'text-green-500'
                      : trend === 'down'
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}
                >
                  {String(change)}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    )
  }

  // ── GaugeChart ───────────────────────────────────────────────────────────────
  if (chartType === 'GaugeChart') {
    const firstItem = chartData[0] || {}
    const rawValue = Number(firstItem[yKey] ?? firstItem.value ?? 0)
    const min = data.min ?? 0
    const max = data.max ?? 100
    const label = data.label ?? String(firstItem[xKey] ?? firstItem.label ?? '')
    const unit = data.unit ?? ''
    const p = Math.min(Math.max((rawValue - min) / (max - min), 0), 1)

    // SVG gauge: semi-circle from left (9 o'clock) to right (3 o'clock) through top
    const cx = 100, cy = 105, r = 72, sw = 14
    const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
    const α = Math.PI * (1 + p)
    const endX = (cx + r * Math.cos(α)).toFixed(2)
    const endY = (cy + r * Math.sin(α)).toFixed(2)
    // large-arc-flag is 0 because the max sweep is 180°
    const valuePath = p > 0.001 ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${endX} ${endY}` : ''
    const gaugeColor = p < 0.4 ? '#16a34a' : p < 0.75 ? '#ea580c' : '#dc2626'

    return (
      <div className="w-full flex flex-col items-center py-4">
        <svg viewBox="0 0 200 130" className="w-full max-w-xs">
          <path d={bgPath} fill="none" stroke="#e5e7eb" strokeWidth={sw} strokeLinecap="round" />
          {valuePath && (
            <path d={valuePath} fill="none" stroke={gaugeColor} strokeWidth={sw} strokeLinecap="round" />
          )}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="24" fontWeight="bold" fill="#13285a">
            {rawValue.toLocaleString()}{unit}
          </text>
          <text x={cx - r + 4} y={cy + 20} textAnchor="middle" fontSize="10" fill="#9ca3af">{min}</text>
          <text x={cx + r - 4} y={cy + 20} textAnchor="middle" fontSize="10" fill="#9ca3af">{max}</text>
        </svg>
        {label && <p className="text-sm font-medium text-gray-600 -mt-2">{label}</p>}
      </div>
    )
  }

  // ── Recharts-based charts ────────────────────────────────────────────────────
  const renderChart = () => {
    switch (chartType) {

      case 'PieChart':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius="70%"
              dataKey={yKey}
              nameKey={xKey}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, yKey]} contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        )

      case 'DonutChart':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="38%"
              outerRadius="65%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              dataKey={yKey}
              nameKey={xKey}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, yKey]} contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        )

      // Vertical bars (the common "bar chart" = columns)
      case 'ColumnChart':
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {data.bars ? (
              data.bars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  fill={bar.fill || COLORS[index % COLORS.length]}
                  name={bar.name || bar.dataKey}
                  radius={[4, 4, 0, 0]}
                />
              ))
            ) : (
              <Bar dataKey={yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        )

      // Horizontal bars
      case 'BarChart':
        return (
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              width={55}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {data.bars ? (
              data.bars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  fill={bar.fill || COLORS[index % COLORS.length]}
                  name={bar.name || bar.dataKey}
                  radius={[0, 4, 4, 0]}
                />
              ))
            ) : (
              <Bar dataKey={yKey} fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            )}
          </BarChart>
        )

      case 'LineChart':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {data.lines ? (
              data.lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke || COLORS[index % COLORS.length]}
                  name={line.name || line.dataKey}
                  strokeWidth={2}
                  dot={{ fill: line.stroke || COLORS[index % COLORS.length], strokeWidth: 2 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ fill: COLORS[0], strokeWidth: 2 }}
              />
            )}
          </LineChart>
        )

      case 'AreaChart':
        return (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={COLORS[0]}
              fill={COLORS[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        )

      case 'Histogram':
        return (
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barCategoryGap="0%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey={yKey} fill={COLORS[0]} stroke="white" strokeWidth={1} />
          </BarChart>
        )

      case 'ScatterChart':
        return (
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" dataKey={xKey} name={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis type="number" dataKey={yKey} name={yKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
            <Legend />
            <Scatter name={data.seriesName || yKey} data={chartData} fill={COLORS[0]} />
          </ScatterChart>
        )

      case 'BubbleChart':
        return (
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" dataKey={xKey} name={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis type="number" dataKey={yKey} name={yKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <ZAxis type="number" dataKey={zKey || 'z'} range={[40, 500]} name={zKey || 'size'} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
            <Legend />
            <Scatter name={data.seriesName || yKey} data={chartData} fill={COLORS[0]} fillOpacity={0.6} />
          </ScatterChart>
        )

      case 'BoxPlot': {
        // Stacked-bar approximation: invisible base + lower whisker + lower box + upper box + upper whisker
        const boxData = chartData.map((item) => ({
          [xKey]: item[xKey],
          _base: Number(item.min ?? 0),
          _lowerWhisker: Math.max(0, Number(item.q1 ?? 0) - Number(item.min ?? 0)),
          _lowerBox: Math.max(0, Number(item.median ?? 0) - Number(item.q1 ?? 0)),
          _upperBox: Math.max(0, Number(item.q3 ?? 0) - Number(item.median ?? 0)),
          _upperWhisker: Math.max(0, Number(item.max ?? 0) - Number(item.q3 ?? 0)),
          min: item.min, q1: item.q1, median: item.median, q3: item.q3, max: item.max,
        }))

        const BoxTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof boxData[0] }[] }) => {
          if (!active || !payload?.length) return null
          const d = payload[0].payload
          return (
            <div style={tooltipStyle} className="p-3 text-sm">
              <p className="font-semibold mb-1">{String(d[xKey])}</p>
              <p>Max: <b>{d.max}</b></p>
              <p>Q3: <b>{d.q3}</b></p>
              <p>Median: <b>{d.median}</b></p>
              <p>Q1: <b>{d.q1}</b></p>
              <p>Min: <b>{d.min}</b></p>
            </div>
          )
        }

        return (
          <ComposedChart data={boxData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip content={<BoxTooltip />} />
            {/* invisible base */}
            <Bar dataKey="_base" stackId="box" fill="transparent" stroke="none" />
            {/* lower whisker (min → q1): outlined only */}
            <Bar dataKey="_lowerWhisker" stackId="box" fill="transparent" stroke={COLORS[0]} strokeWidth={1} />
            {/* lower box (q1 → median) */}
            <Bar dataKey="_lowerBox" stackId="box" fill={COLORS[0]} fillOpacity={0.35} stroke={COLORS[0]} strokeWidth={1.5} name="IQR (lower)" />
            {/* upper box (median → q3) */}
            <Bar dataKey="_upperBox" stackId="box" fill={COLORS[1]} fillOpacity={0.35} stroke={COLORS[0]} strokeWidth={1.5} name="IQR (upper)" />
            {/* upper whisker (q3 → max): outlined only */}
            <Bar dataKey="_upperWhisker" stackId="box" fill="transparent" stroke={COLORS[0]} strokeWidth={1} />
          </ComposedChart>
        )
      }

      default:
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey={yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        )
    }
  }

  return (
    <div className="w-full bg-white rounded-lg p-2 md:p-4">
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
