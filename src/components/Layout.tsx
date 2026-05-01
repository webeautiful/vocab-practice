import type { ReactNode } from 'react'

interface LayoutProps {
  title?: string
  onBack?: () => void
  children: ReactNode
}

export default function Layout({ title, onBack, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col">
      {title && (
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-2xl text-sky-600 leading-none"
              aria-label="返回"
            >
              ←
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </header>
      )}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">{children}</main>
    </div>
  )
}
