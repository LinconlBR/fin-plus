"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "cn"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-3 font-medium data-[variant=legend]:text-base data-[variant=label]:text-sm",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group flex w-full flex-col gap-6 data-[slot=checkbox-group]:gap-3",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva("group/field flex w-full gap-3", {
  variants: {
    orientation: {
      vertical: "flex-col [&>*]:w-full",
      horizontal: "flex-row items-center",
      responsive: "flex-col sm:flex-row sm:items-center",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("flex flex-1 flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "flex items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        "peer-data-[invalid=true]/field:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-title"
      className={cn("text-sm leading-snug font-medium", className)}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-sm leading-normal font-normal",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-separator"
      className={cn("relative -my-2 h-5 text-sm", className)}
      {...props}
    >
      <div className="bg-border absolute inset-0 top-1/2 h-px" />
      {children && (
        <span className="bg-background text-muted-foreground relative mx-auto block w-fit px-2">
          {children}
        </span>
      )}
    </div>
  )
}

// errors: aceita o array que o TanStack Form entrega em field.state.meta.errors —
// cada item pode ser uma string ou um objeto com .message (dependendo de como o
// erro foi gerado, direto do Zod ou de uma validação customizada).
function FieldError({
  className,
  errors,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  errors?: Array<string | { message?: string } | undefined | null>
}) {
  const content =
    children ??
    errors
      ?.map((error) =>
        typeof error === "string" ? error : error?.message
      )
      .filter(Boolean)
      .join(", ")

  if (!content) {
    return null
  }

  return (
    <p
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      role="alert"
      {...props}
    >
      {content}
    </p>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}