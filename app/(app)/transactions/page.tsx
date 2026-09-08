"use client";

import { DataTable } from "@/components/ui/data-table";
import data from "./data.json"

export default function TransactionsPage() {
	
	return (
		<main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
			<DataTable data={data} /> 
		</main>
	);
}
