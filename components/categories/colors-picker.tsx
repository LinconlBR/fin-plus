import { CATEGORY_COLORS } from "@/components/categories/category-colors";

interface ColorPickerProps {
	value: string;
	onChange: (color: string) => void;
}

export function ColorsPicker({ value, onChange }: ColorPickerProps) {
	return (
		<div className="flex flex-wrap gap-3">
			{CATEGORY_COLORS.map((color) => (
				<button
					key={color}
					type="button"
					aria-label={`Selecionar cor ${color}`}
					aria-pressed={color === value}
					onClick={() => onChange(color)}
					style={{ backgroundColor: color }}
					className={`h-8 w-8 rounded-full ${
						color === value ? "ring-2 ring-offset-2 ring-foreground" : ""
					}`}
				/>
			))}
		</div>
	);
}

export default ColorsPicker;