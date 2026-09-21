import type { ComponentType } from "react";

import { iconMap } from "@/components/categories/category-icons";
import { Button } from "../ui/button";

type IconsPickerProps = {
	value: string;
	onChange: (icon: string) => void;
};

export function IconsPicker({ value, onChange }: IconsPickerProps) {
	return (
		<div className="grid grid-cols-8 gap-2">
			{Object.entries(iconMap).map(([name, Icon]) => {
				const IconComponent = Icon as ComponentType<{ className?: string }>;
				const selected = name === value;

				return (
					<Button
                        size="icon"
                        variant="ghost"
						key={name}
						type="button"
						aria-label={name}
						aria-pressed={selected}
						onClick={() => onChange(name)}
						className={`flex items-center justify-center rounded-md border p-2 transition-colors ${
							selected
								? "border-primary bg-primary/10"
								: "border-transparent hover:border-muted-foreground/50"
						}`}
					>
						<IconComponent className="size-5" />
					</Button>
				);
			})}
		</div>
	);
}

export default IconsPicker;
