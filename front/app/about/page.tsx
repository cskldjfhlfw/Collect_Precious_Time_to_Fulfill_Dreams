import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "团队介绍 | 鹏程万里科研团队",
  description: "了解鹏程万里科研团队的使命、成员与研究方向。",
}

const teamMembers = [
  {
    name: "张鹏",
    role: "团队负责人 / 教授",
    expertise: "大数据舆情专家",
    contribution: "负责整体科研战略规划与跨领域协同合作推进。",
  },
  {
    name: "xxx",
    role: "数据科学家",
    expertise: "科学计算与知识图谱",
    contribution: "主导科研数据治理、知识图谱构建与算法评估。",
  },
  {
    name: "xxx",
    role: "交互设计师",
    expertise: "可视化交互与体验设计",
    contribution: "构建用户体验标准，推动成果可视化落地应用。",
  },
  {
    name: "xxx",
    role: "高级工程师",
    expertise: "云原生与工程平台",
    contribution: "搭建高可靠工程平台，保障科研成果快速迭代交付。",
  },
]

const researchFocus = [
  {
    title: "智能科研平台",
    description: "构建覆盖成果管理全生命周期的智能化平台，提供数据融合、评价分析与趋势洞察能力。",
  },
  {
    title: "行业联合创新",
    description: "携手科研机构与企业伙伴，推动科研成果转化，探索面向实际场景的解决方案。",
  },
  {
    title: "开放共享生态",
    description: "秉持开放协作理念，沉淀高质量工具与模板，助力更多科研团队提升效率。",
  },
  {
    title: "xxx",
    description: "编不下去了",
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="container mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
            <span className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
              团队介绍
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              鹏程万里科研团队
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              我们是一支跨学科的科研创新团队，专注于科研成果的数字化、可视化与智能化管理。
              团队成员来自人工智能、数据科学、设计与工程领域，为科研机构提供全流程的技术赋能与创新支持。
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-700">跨学科协作</div>
              <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">科研成果转化</div>
              <div className="rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-700">持续创新</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-500 p-[1px] shadow-xl">
              <div className="rounded-3xl bg-white p-8">
                <div className="grid grid-cols-2 gap-6 text-center text-sm text-slate-700">
                  <div className="rounded-2xl bg-sky-50 px-4 py-6 shadow-sm">
                    <p className="text-3xl font-semibold text-sky-600">99+</p>
                    <p className="mt-1">核心科研成果</p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 px-4 py-6 shadow-sm">
                    <p className="text-3xl font-semibold text-indigo-600">99+</p>
                    <p className="mt-1">合作单位</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-6 shadow-sm">
                    <p className="text-3xl font-semibold text-emerald-600">88+</p>
                    <p className="mt-1">跨学科领域</p>
                  </div>
                  <div className="rounded-2xl bg-purple-50 px-4 py-6 shadow-sm">
                    <p className="text-3xl font-semibold text-purple-600">99+</p>
                    <p className="mt-1">技术支持</p>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-sky-200/40 blur-2xl" />
              <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-indigo-200/40 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900">团队使命与价值观</h2>
            <p className="text-base leading-relaxed text-slate-600">
              鹏程万里团队以“让科研成果产生真实影响力”为使命，致力于构建开放高效的科研生态。
              我们坚持以问题为导向、以数据为支撑、以体验为标准，推动科研成果在更多场景中落地。
            </p>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white">1</span>
                <div>
                  <h3 className="text-base font-medium text-slate-900">科研驱动</h3>
                  <p className="mt-1">
                    聚焦真实科研需求，构建可演进的平台能力，帮助研究者洞察趋势、评估价值、加速创新。
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">2</span>
                <div>
                  <h3 className="text-base font-medium text-slate-900">开放共创</h3>
                  <p className="mt-1">
                    与高校、研究院、企业伙伴建立长期合作网络，形成开放共享的科研成果生态。
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white">3</span>
                <div>
                  <h3 className="text-base font-medium text-slate-900">以人为本</h3>
                  <p className="mt-1">
                    从研究者与管理者的实际体验出发，强调工具的易用性、可解释性与持续迭代能力。
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">重点研究方向</h2>
            <p className="mt-3 text-sm text-slate-600">
              我们通过跨学科协作与工程化实践，在以下方向持续深耕：
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {researchFocus.map((item) => (
                <div key={item.title} className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-6 transition hover:border-sky-300 hover:bg-white hover:shadow-lg">
                  <h3 className="text-base font-medium text-slate-900 group-hover:text-sky-600">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="container mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">核心团队成员</h2>
              <p className="mt-2 text-sm text-slate-600">跨领域的专家团队，共同塑造科研成果管理的未来。</p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-sky-700">
              <span className="h-px w-8 bg-sky-400" /> Insight & Collaboration
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {teamMembers.map((member) => (
              <article key={member.name} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-8 transition hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white">
                    {member.name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-600">{member.name}</h3>
                    <p className="text-sm text-slate-600">{member.role}</p>
                  </div>
                </div>
                <dl className="mt-6 space-y-3 text-sm text-slate-600">
                  <div>
                    <dt className="font-medium text-slate-900">研究方向</dt>
                    <dd className="mt-1">{member.expertise}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">主要贡献</dt>
                    <dd className="mt-1 leading-relaxed">{member.contribution}</dd>
                  </div>
                </dl>
                <div className="pointer-events-none absolute -bottom-6 -right-4 h-20 w-20 rounded-full bg-sky-100/80 blur-2xl" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-100">
        <div className="container mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-[3fr_2fr] md:items-start">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="h-px w-6 bg-slate-400" /> 合作愿景
              </span>
              <h2 className="text-2xl font-semibold text-slate-900">与我们携手推动科研成果价值最大化</h2>
              <p className="text-sm leading-relaxed text-slate-600">
                团队正在与越来越多的高校、研究机构及企业建立深度合作。我们提供成果评估、数据治理、科技成果转化咨询等服务，期待与您共同探索未来科研的新模式。
              </p>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-8 shadow-sm">
              <h3 className="text-lg font-medium text-slate-900">联系我们</h3>
              <p className="mt-2 text-sm text-slate-600">欢迎通过以下方式获取合作资料与支持：</p>
              <ul className="mt-6 space-y-4 text-sm text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700">
                    邮
                  </span>
                  置空
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700">
                    微
                  </span>
                  @置空
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700">
                    合
                  </span>
                  表单：置空
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
