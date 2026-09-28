import Link from "next/link";

const summary = [
	{ label: "Receitas", value: "R$ 18.450,00", change: "+12,5%", tone: "text-emerald-600" },
	{ label: "Despesas", value: "R$ 11.280,00", change: "-4,2%", tone: "text-rose-600" },
	{ label: "Saldo líquido", value: "R$ 7.170,00", change: "+18,7%", tone: "text-emerald-600" },
];

const categories = [
	{ name: "Moradia", value: "R$ 3.240,00", percent: 72, color: "bg-blue-500" },
	{ name: "Alimentação", value: "R$ 2.180,00", percent: 54, color: "bg-violet-500" },
	{ name: "Transporte", value: "R$ 1.460,00", percent: 38, color: "bg-amber-500" },
	{ name: "Lazer", value: "R$ 980,00", percent: 26, color: "bg-pink-500" },
];

export default function ReportsPage() {
	return (
		<main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8 lg:px-12">
			<div className="mx-auto max-w-7xl space-y-8">
				<header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<p className="text-sm font-medium text-slate-500">Visão geral</p>
						<h1 className="mt-1 text-3xl font-bold tracking-tight">Resumo de relatórios</h1>
						<p className="mt-2 text-sm text-slate-500">Acompanhe a evolução das suas finanças em um só lugar.</p>
					</div>
					<div className="flex items-center gap-3">
						<select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none" defaultValue="30">
							<option value="30">Últimos 30 dias</option>
							<option value="90">Últimos 3 meses</option>
							<option value="365">Último ano</option>
						</select>
						<Link href="/transactions" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">
							Ver transações
						</Link>
					</div>
				</header>

				<section className="grid gap-4 md:grid-cols-3">
					{summary.map((item) => (
						<div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
							<p className="text-sm text-slate-500">{item.label}</p>
							<div className="mt-3 flex items-end justify-between gap-3">
								<p className="text-2xl font-bold">{item.value}</p>
								<span className={`text-sm font-semibold ${item.tone}`}>{item.change}</span>
							</div>
							<div className="mt-4 h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.label === "Despesas" ? "w-1/2 bg-rose-400" : "w-3/4 bg-emerald-400"}`} /></div>
						</div>
					))}
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
					<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex items-start justify-between">
							<div><h2 className="font-semibold">Fluxo financeiro</h2><p className="mt-1 text-sm text-slate-500">Receitas e despesas no período</p></div>
							<div className="flex gap-3 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Receitas</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400" />Despesas</span></div>
						</div>
						<div className="mt-8 flex h-52 items-end justify-around gap-2 border-b border-l border-slate-100 px-2">
							{[58, 72, 48, 82, 66, 91, 76].map((height, index) => <div key={index} className="flex h-full items-end gap-1"><div className="w-3 rounded-t bg-emerald-400" style={{ height: `${height}%` }} /><div className="w-3 rounded-t bg-rose-300" style={{ height: `${Math.max(25, height - 28)}%` }} /></div>)}
						</div>
						<div className="mt-2 flex justify-around text-xs text-slate-400"><span>01</span><span>05</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span></div>
					</div>

					<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
						<h2 className="font-semibold">Despesas por categoria</h2><p className="mt-1 text-sm text-slate-500">Distribuição dos seus gastos</p>
						<div className="mt-6 space-y-5">{categories.map((category) => <div key={category.name}><div className="mb-2 flex justify-between text-sm"><span className="font-medium">{category.name}</span><span className="text-slate-500">{category.value}</span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${category.color}`} style={{ width: `${category.percent}%` }} /></div></div>)}</div>
						<Link href="/reports/categories" className="mt-6 block text-center text-sm font-semibold text-blue-600 hover:text-blue-700">Ver relatório completo →</Link>
					</div>
				</section>
			</div>
		</main>
	);
}
