import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // Verify the book exists
    const book = await prisma.book.findUnique({
      where: { id },
      select: { id: true, name: true, type: true },
    });

    if (!book || book.type !== 'HARD_COPY') {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Get the base URL from the request or environment variable
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const qrUrl = `${baseUrl}/qr/${id}`;

    // Generate QR code as SVG
    const qrCodeSvg = await QRCode.toString(qrUrl, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Return SVG with appropriate headers
    return new NextResponse(qrCodeSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}

// Generate a printable QR code page
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    console.log('[QR Code API] Generating QR code for book:', id);

    // Verify the book exists
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        publications: {
          include: {
            publication: true,
          },
        },
      },
    });

    console.log('[QR Code API] Book found:', book ? { id: book.id, name: book.name, type: book.type } : null);

    if (!book) {
      console.error('[QR Code API] Book not found');
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.type !== 'HARD_COPY') {
      console.error('[QR Code API] Book is not hard copy, type:', book.type);
      return NextResponse.json({ error: 'QR codes are only available for hard copy books' }, { status: 400 });
    }

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const qrUrl = `${baseUrl}/qr/${id}`;

    console.log('[QR Code API] QR URL:', qrUrl);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log('[QR Code API] QR code generated successfully');

    // Return printable data
    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      book: {
        id: book.id,
        name: book.name,
        authors: book.authors.map((a) => a.author.name).join(', '),
        publications: book.publications.map((p) => p.publication.name).join(', '),
      },
      url: qrUrl,
    });
  } catch (error) {
    console.error('[QR Code API] Error generating QR code data:', error);
    return NextResponse.json({ error: 'Failed to generate QR code data' }, { status: 500 });
  }
}
