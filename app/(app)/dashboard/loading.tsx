


export default function Loading() {
	return (
		<main className="space-y-6 p-6" aria-busy="true" aria-label="Carregando dashboard">
			<div className="space-y-2">
				<div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
				<div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
			</div>

			<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={index} className="rounded-xl border bg-card p-5 shadow-sm">
						<div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
						<div className="h-8 w-32 animate-pulse rounded bg-muted" />
						<div className="mt-3 h-3 w-20 animate-pulse rounded bg-muted" />
					</div>
				))}
			</section>

			<section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
				<div className="rounded-xl border bg-card p-5 shadow-sm">
					<div className="mb-6 h-5 w-40 animate-pulse rounded bg-muted" />
					<div className="flex h-64 items-end gap-3">
						{Array.from({ length: 12 }).map((_, index) => (
							<div
								key={index}
								className="w-full animate-pulse rounded-t bg-muted"
								style={{ height: `${35 + ((index * 17) % 55)}%` }}
							/>
						))}
					</div>
				</div>

				<div className="rounded-xl border bg-card p-5 shadow-sm">
					<div className="mb-6 h-5 w-36 animate-pulse rounded bg-muted" />
					<div className="space-y-5">
						{Array.from({ length: 5 }).map((_, index) => (
							<div key={index} className="flex items-center gap-3">
								<div className="size-10 animate-pulse rounded-full bg-muted" />
								<div className="flex-1 space-y-2">
									<div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
									<div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
								</div>
								<div className="h-4 w-16 animate-pulse rounded bg-muted" />
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
	)
}

