"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Erro no dashboard:", error);
	}, [error]);

	return (
		<main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
			<div className="w-full max-w-md rounded-lg border bg-background p-8 shadow-sm">
				<h1 className="text-2xl font-semibold tracking-tight">
					Algo deu errado
				</h1>
				<p className="mt-3 text-sm text-muted-foreground">
                    {error.message ? error.message : "Não foi possível carregar o dashboard."} <br />
					Tente novamente ou volte mais tarde.
				</p>
				<Button
					variant="outline"
					onClick={() => reset()}
				>
					Tentar novamente
				</Button>
			</div>
		</main>
	);
}
