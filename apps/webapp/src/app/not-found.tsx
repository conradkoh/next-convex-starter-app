import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ErrorPanel } from '@/modules/errors/ErrorPanel';

export default function NotFound() {
  return (
    <ErrorPanel
      variant="page"
      tone="neutral"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have moved."
      icon={<FileQuestion className="size-5" />}
      actions={
        <Link href="/" className={cn(buttonVariants(), 'w-full sm:w-auto')}>
          Go to home
        </Link>
      }
    />
  );
}
