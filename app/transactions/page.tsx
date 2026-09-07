"use client";

import { useMemo, useState } from "react";

type Transaction = {
	id: number;
	description: string;
	category: string;
	date: string;
	amount: number;
	type: "income" | "expense";
};

const transactions: Transaction[] = [
	{ id: 1, description: "Salário", category: "Renda", date: "28/05/2024", amount: 5200, type: "income" },
	{ id: 2, description: "Supermercado", category: "Alimentação", date: "27/05/2024", amount: 246.8, type: "expense" },
	{ id: 3, description: "Aluguel", category: "Moradia", date: "25/05/2024", amount: 1800, type: "expense" },
	{ id: 4, description: "Netflix", category: "Assinaturas", date: "24/05/2024", amount: 55.9, type: "expense" },
	{ id: 5, description: "Freelance de design", category: "Renda extra", date: "22/05/2024", amount: 950, type: "income" },
];

const formatCurrency = (value: number) =>
	value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function TransactionsPage() {
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState("all");

	const filtered = useMemo(() => transactions.filter((item) => {
		const matchesQuery = item.description.toLowerCase().includes(query.toLowerCase());
		const matchesFilter = filter === "all" || item.type === filter;
		return matchesQuery && matchesFilter;
	}), [query, filter]);

	const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
	const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);

	return (
		<main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
			<div className="mx-auto max-w-6xl">
				<header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div><p className="text-sm font-semibold text-emerald-600">Fin Plus</p><h1 className="text-3xl font-bold">Transações</h1><p className="mt-1 text-sm text-slate-500">Acompanhe sua movimentação financeira.</p></div>
					<button className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">+ Nova transação</button>
				</header>

				<section className="mb-6 grid gap-4 sm:grid-cols-3">
					{[["Saldo do período", income - expenses, "text-slate-900"], ["Entradas", income, "text-emerald-600"], ["Saídas", expenses, "text-rose-600"]].map(([label, value, color]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{formatCurrency(Number(value))}</p><p className="mt-1 text-xs text-slate-400">Este mês</p></div>)}
				</section>

				<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
					<div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center"><div><h2 className="font-semibold">Histórico de transações</h2><p className="mt-1 text-sm text-slate-500">Suas movimentações recentes</p></div><div className="flex gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="all">Todas</option><option value="income">Entradas</option><option value="expense">Saídas</option></select></div></div>
					<div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Descrição</th><th className="px-5 py-3">Categoria</th><th className="px-5 py-3">Data</th><th className="px-5 py-3 text-right">Valor</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-medium">{item.description}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.category}</span></td><td className="px-5 py-4 text-slate-500">{item.date}</td><td className={`px-5 py-4 text-right font-semibold ${item.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{item.type === "income" ? "+" : "−"} {formatCurrency(item.amount)}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Nenhuma transação encontrada.</p>}</div>
					<footer className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">Exibindo {filtered.length} de {transactions.length} transações</footer>
				</section>
			</div>
		</main>
	);
}
