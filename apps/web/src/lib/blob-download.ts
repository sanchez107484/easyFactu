/**
 * Triggers a file download in the browser using a Blob.
 * Creates a temporary object URL, clicks it programmatically, then revokes it.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke after a tick so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
