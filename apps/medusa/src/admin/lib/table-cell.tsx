import { Table } from "@medusajs/ui"
import type { ReactNode } from "react"

/** Medusa Table.Cell types omit colSpan — spread for empty/loading rows. */
export function ShcTableCell({
  colSpan,
  children,
  className,
}: {
  colSpan?: number
  children: ReactNode
  className?: string
}) {
  const spanProps = colSpan != null ? ({ colSpan } as Record<string, unknown>) : {}
  return (
    <Table.Cell className={className} {...spanProps}>
      {children}
    </Table.Cell>
  )
}
