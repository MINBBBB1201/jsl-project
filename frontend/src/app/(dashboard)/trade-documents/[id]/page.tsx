"use client"

import { useParams } from "next/navigation"

import { TradeDocumentEditor } from "./trade-document-editor"

export default function TradeDocumentDetailPage() {
  const params = useParams<{ id: string }>()
  return <TradeDocumentEditor id={params.id} />
}
