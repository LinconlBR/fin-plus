"use client"

import { useState, useTransition } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { saveDashboardLayout } from "@/lib/actions/preferences"
import {
  DASHBOARD_WIDGETS,
  DEFAULT_LAYOUT,
  type WidgetPreference,
} from "@/lib/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

const widgetInfo = Object.fromEntries(DASHBOARD_WIDGETS.map((widget) => [widget.id, widget]))

function SortableRow({
  item,
  onToggle,
}: {
  item: WidgetPreference
  onToggle: (visible: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const info = widgetInfo[item.id]

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10" : undefined}
    >
      <Card size="sm" className={isDragging ? "shadow-lg ring-accent-violet/40" : undefined}>
        <div className="flex items-center gap-3 px-(--card-spacing)">
          <button
            type="button"
            aria-label={`Reordenar ${info.label}`}
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>

          <div className={item.visible ? "flex-1" : "flex-1 opacity-50"}>
            <p className="text-sm font-medium">{info.label}</p>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>

          <Switch
            checked={item.visible}
            onCheckedChange={onToggle}
            aria-label={`Mostrar ${info.label}`}
          />
        </div>
      </Card>
    </div>
  )
}

export function DashboardLayoutEditor({ initialLayout }: { initialLayout: WidgetPreference[] }) {
  const [layout, setLayout] = useState(initialLayout)
  const [status, setStatus] = useState<{ kind: "saved" | "error"; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Arrastar com o mouse/toque (com uma distância mínima, para o clique não virar arrasto)
  // ou com o teclado (espaço para pegar, setas para mover, espaço para soltar).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setLayout((current) => {
      const from = current.findIndex((item) => item.id === active.id)
      const to = current.findIndex((item) => item.id === over.id)
      return arrayMove(current, from, to)
    })
    setStatus(null)
  }

  function handleToggle(id: string, visible: boolean) {
    setLayout((current) => current.map((item) => (item.id === id ? { ...item, visible } : item)))
    setStatus(null)
  }

  function handleReset() {
    setLayout(DEFAULT_LAYOUT.map((item) => ({ ...item })))
    setStatus(null)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveDashboardLayout(layout)
      setStatus(
        result?.error
          ? { kind: "error", message: result.error }
          : { kind: "saved", message: "Layout salvo. Ele já vale no seu Dashboard." }
      )
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Arraste os blocos para mudar a ordem e use o interruptor para mostrar ou ocultar cada um no
        Dashboard.
      </p>

      <DndContext
        id="dashboard-layout-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {layout.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                onToggle={(visible) => handleToggle(item.id, visible)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar layout"}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isPending}>
          Restaurar padrão
        </Button>
        {status && (
          <p
            role="status"
            className={
              status.kind === "error" ? "text-sm text-destructive" : "text-sm text-success"
            }
          >
            {status.message}
          </p>
        )}
      </div>
    </div>
  )
}
