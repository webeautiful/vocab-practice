interface BarChartProps {
  data: { label: string; value: number }[]
}

export default function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-600">{d.value}</span>
          <div
            className="w-full bg-sky-400 rounded-t-md transition-all duration-300"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
          />
          <span className="text-xs text-gray-500">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
