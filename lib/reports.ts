
export type  ReportPeriod = "month" | "year";

export type ExpenseRow = {
  amount: number | string
  category_id: string | null
  categories: { name: string; color: string | null } | null
}
export const changeToneClass = {
  good: "text-success",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
}

export type ChangeTone = "good" | "bad" | "neutral"

export function changeTone(change: number | null, higherIsBetter: boolean): ChangeTone {
  if (change === null || Math.abs(change) < 0.5) return "neutral"
  return (change > 0) === higherIsBetter ? "good" : "bad"
}


export function toDateString(date: Date): string {
    return date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");

}

export function getPeriodRange( period: ReportPeriod, date: Date): { start: Date, end: Date } {
    
    const start = new Date(date);
    start.setHours(0, 0, 0, 0)
    if (period === "month") {
        start.setDate(1);
    } else {
        start.setMonth(0);
        start.setDate(1);
    }
    const end = new Date(start);
    if (period === "month") {
        end.setMonth(end.getMonth() + 1);
    } else {
        end.setFullYear(end.getFullYear() + 1);
    }
    end.setDate(end.getDate() - 1);
    return { start, end };
}

export function getPreviousPeriodRange(period: ReportPeriod, date: Date): { start: Date, end: Date } {
    const currentPeriodRange = getPeriodRange(period, date);
    const previousPeriodEnd = new Date(currentPeriodRange.start);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    return getPeriodRange(period, previousPeriodEnd);
}

export function parsePeriod(value: string | string[] | undefined): ReportPeriod {
  return value === "year" ? "year" : "month"
}

export function getPeriodRangeStrings(period: ReportPeriod, date: Date = new Date()) {
  const { start, end } = getPeriodRange(period, date)
  return { start: toDateString(start), end: toDateString(end) }
}

export function getPreviousPeriodRangeStrings(period: ReportPeriod, date: Date = new Date()) {
  const { start, end } = getPreviousPeriodRange(period, date)
  return { start: toDateString(start), end: toDateString(end) }
}

export function percentChange(current: number, previous: number): number | null {
        if (previous === 0) return null;
        return ((current - previous) / previous) * 100;
}


export function groupExpensesByCategory(rows: ExpenseRow[]) {
    const groups = new Map<string, {
        id: string;
        name: string;
        color: string;
        total: number;
    }>();

    for (const row of rows) {
        const id = row.category_id ?? "uncategorized";
        const group = groups.get(id);
        const amount = Number(row.amount);

        if (group) {
            group.total += amount;
        } else {
            groups.set(id, {
                id,
                name: row.categories?.name ?? "Sem categoria",
                color: row.categories?.color ?? "#64748b",
                total: amount,
            });
        }
    }

    const total = [...groups.values()].reduce((sum, group) => sum + group.total, 0);
    const items = [...groups.values()]
        .sort((a, b) => b.total - a.total)
        .map((group) => ({
            ...group,
            percentage: total === 0 ? 0 : (group.total / total) * 100,
        }));

    return { items, total };
}

