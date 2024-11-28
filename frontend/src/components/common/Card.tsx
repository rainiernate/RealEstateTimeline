interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg leading-6 font-medium text-gray-900">
      {children}
    </h3>
  )
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-sm text-gray-500">
      {children}
    </p>
  )
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-5 sm:p-6">
      {children}
    </div>
  )
}
