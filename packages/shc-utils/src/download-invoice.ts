/**
 * Client helpers to download order invoice PDF (web blob / RN file share).
 */

export type InvoiceDownloadPayload = {
  pdf_base64: string;
  filename?: string;
  mime?: string;
};

/** Browser: trigger file download of base64 PDF. */
export function downloadPdfBase64InBrowser(payload: InvoiceDownloadPayload): void {
  const filename = payload.filename || 'invoice.pdf';
  const mime = payload.mime || 'application/pdf';
  const binary = atob(payload.pdf_base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Decode base64 to utf8/binary string for RN FileSystem write. */
export function pdfBase64ToDataUri(base64: string, mime = 'application/pdf'): string {
  return `data:${mime};base64,${base64}`;
}
