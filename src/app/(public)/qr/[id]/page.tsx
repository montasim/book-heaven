import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QRRedirectPage({ params }: Props) {
  const { id } = await params;

  // Verify the book exists before redirecting
  const book = await prisma.book.findUnique({
    where: { id },
    select: { id: true, type: true, isPublic: true },
  });

  // If book doesn't exist or is not a hard copy, redirect to library list
  if (!book || book.type !== 'HARD_COPY') {
    redirect('/physical-library');
  }

  // Redirect to the physical library book detail page
  redirect(`/physical-library/${id}`);
}
