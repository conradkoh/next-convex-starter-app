'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { File, FileText, Image, X } from 'lucide-react';
import type { FileAttachment } from './file-upload';

/**
 * Props for the FileAttachmentList component
 */
interface FileAttachmentListProps {
  /** Array of selected files */
  files: FileAttachment[];
  /** Callback function called when a file should be removed */
  onRemoveFile: (fileId: string) => void;
  /** Whether the list is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FileAttachmentList component displays selected files in a vertical list above the chat input.
 * Shows file icons, names, sizes, and remove buttons.
 *
 * @param props - The component props
 * @returns JSX element representing the file attachment list
 */
export function FileAttachmentList({
  files,
  onRemoveFile,
  disabled = false,
  className,
}: FileAttachmentListProps) {
  if (files.length === 0) {
    return null;
  }

  /**
   * Get appropriate icon for file type
   */
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={cn('space-y-2 p-3 border-b bg-muted/30', className)}>
      <div className="text-xs text-muted-foreground font-medium">
        Attached Files ({files.length})
      </div>
      <div className="space-y-1">
        {files.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-2 p-2 bg-background rounded-md border"
          >
            {/* File Icon */}
            <div className="text-muted-foreground">{getFileIcon(attachment.file)}</div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{attachment.file.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file.size)} • {attachment.file.type || 'Unknown type'}
              </div>
            </div>

            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveFile(attachment.id)}
              disabled={disabled}
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              title={`Remove ${attachment.file.name}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
