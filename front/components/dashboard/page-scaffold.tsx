import type { ReactNode } from "react"

export type DashboardSection = {
  title: string
  description: string
  placeholder: ReactNode
  action?: ReactNode
}

export type DashboardPageScaffoldProps = {
  title: string
  description: string
  sections: DashboardSection[]
}

export function DashboardPlaceholder({
  summary,
  details = [],
}: {
  summary: string
  details?: string[]
}) {
  return (
    <div className="space-y-2">
      <p className="text-slate-600">{summary}</p>
      {details.map((detail, index) => (
        <p key={index} className="text-xs text-slate-400">
          {detail}
        </p>
      ))}
    </div>
  )
}

export function DashboardPageScaffold({ title, description, sections }: DashboardPageScaffoldProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
      </header>

      <div className="grid gap-6">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 shadow-sm"
            aria-labelledby={`${section.title}-heading`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id={`${section.title}-heading`} className="text-lg font-semibold text-slate-900">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{section.description}</p>
              </div>
              {section.action && <div className="flex shrink-0 items-center gap-3 text-sm text-slate-500">{section.action}</div>}
            </div>
            <div className="mt-4 rounded-xl bg-slate-100/70 p-4 text-sm text-slate-500">
              {section.placeholder}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
