interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="w-full bg-gray-200 rounded-full h-3" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      <div
        className="bg-sky-400 h-3 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
