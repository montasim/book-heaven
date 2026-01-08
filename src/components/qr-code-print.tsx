'use client';

import { useState } from 'react';
import { Loader2, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QRCodePrintProps {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QRCodeData {
  qrCode: string;
  book: {
    id: string;
    name: string;
    authors: string;
    publications: string;
  };
  url: string;
}

export function QRCodePrint({ bookId, open, onOpenChange }: QRCodePrintProps) {
  const [data, setData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[QRCodePrint] Fetching QR code for book:', bookId);
      const response = await fetch(`/api/books/${bookId}/qr-code`, { method: 'POST' });
      console.log('[QRCodePrint] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[QRCodePrint] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate QR code');
      }

      const qrData = await response.json();
      console.log('[QRCodePrint] QR code data received:', qrData);
      setData(qrData);
    } catch (err) {
      console.error('[QRCodePrint] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('qr-code-printable');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${data?.book.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
              }
              .qr-label {
                border: 2px solid #000;
                padding: 20px;
                text-align: center;
                width: 350px;
                page-break-inside: avoid;
              }
              .qr-label h2 {
                margin: 0 0 10px 0;
                font-size: 16px;
                word-wrap: break-word;
                line-height: 1.3;
              }
              .qr-label .author {
                margin: 5px 0;
                font-size: 12px;
                color: #666;
              }
              .qr-label .qr-image {
                margin: 15px 0;
                display: flex;
                justify-content: center;
              }
              .qr-label .qr-image img {
                width: 150px;
                height: 150px;
              }
              .qr-label .instructions {
                margin-top: 10px;
                font-size: 10px;
                color: #888;
              }
              @media print {
                body { padding: 0; }
                .qr-label { border: 2px solid #000; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !data) {
      fetchQRCode();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print QR Code</DialogTitle>
          <DialogDescription>
            Generate and print a QR code label for this physical book
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-4 space-y-3">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-xs text-destructive mt-1">{error}</p>
              </div>
              <Button onClick={fetchQRCode} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Preview */}
              <div className="flex justify-center p-4 border rounded-lg bg-muted/30">
                <div
                  id="qr-code-printable"
                  className="border-2 border-border p-4 text-center bg-white"
                  style={{ width: '300px' }}
                >
                  <h3 className="font-semibold text-base mb-1 line-clamp-3 min-h-[60px]">
                    {data.book.name}
                  </h3>
                  {data.book.authors && (
                    <p className="text-xs text-muted-foreground mb-1">by {data.book.authors}</p>
                  )}
                  {data.book.publications && (
                    <p className="text-xs text-muted-foreground mb-2">{data.book.publications}</p>
                  )}
                  <div className="flex justify-center my-2">
                    <img src={data.qrCode} alt="QR Code" className="w-32 h-32" />
                  </div>
                  <p className="text-xs text-muted-foreground">Scan to view book details</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="outline">
                  Close
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                The QR code points to <code className="bg-muted px-1 rounded">{data.url}</code>
                <br />
                This URL will work even if you change your domain.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
