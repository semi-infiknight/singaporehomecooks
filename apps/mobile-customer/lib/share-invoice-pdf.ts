/**
 * Write invoice PDF bytes to cache and open the system share sheet as application/pdf.
 * Uses expo-file-system/legacy (v19 default API throws on writeAsStringAsync).
 */
import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type InvoicePdfResponse = {
  pdf_base64?: string;
  filename?: string;
  mime?: string;
};

function safeFilename(name: string, fallback: string): string {
  let f = (name || fallback).replace(/[^\w.\-]+/g, '_');
  if (!f.toLowerCase().endsWith('.pdf')) f = `${f}.pdf`;
  return f;
}

export async function shareInvoicePdf(res: InvoicePdfResponse, fallbackName = 'invoice.pdf'): Promise<void> {
  const b64raw = res.pdf_base64;
  if (!b64raw || b64raw.length < 32) {
    throw new Error('Invoice PDF missing from server — try again or open web portal.');
  }
  const b64 = b64raw.replace(/^data:application\/pdf;base64,/i, '').trim();
  const head = (() => {
    try {
      const sample = b64.slice(0, 16);
      if (typeof atob === 'function') {
        return atob(sample).slice(0, 5);
      }
    } catch {
      /* ignore */
    }
    return '%PDF-';
  })();
  if (head && head !== '%PDF-' && !head.startsWith('%PDF')) {
    throw new Error('Server returned invalid PDF data.');
  }

  const filename = safeFilename(res.filename || '', fallbackName);
  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) {
    throw new Error('Device storage unavailable for PDF.');
  }
  const path = `${dir}${filename}`;

  await FileSystem.writeAsStringAsync(path, b64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    throw new Error('Could not write PDF file.');
  }
  if ('size' in info && typeof info.size === 'number' && info.size < 64) {
    throw new Error('PDF file too small — write may have failed.');
  }

  const canShare = await Sharing.isAvailableAsync().catch(() => false);
  if (canShare) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/pdf',
      dialogTitle: filename,
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  const url = path.startsWith('file://') ? path : `file://${path}`;
  await Share.share(
    Platform.OS === 'ios'
      ? { url, title: filename }
      : { url, title: filename, message: filename }
  );
}
