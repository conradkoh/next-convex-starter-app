'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Paperclip } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

/**
 * File attachment interface
 */
export interface FileAttachment {
  file: File;
  id: string; // Unique identifier for the file
}

/**
 * Props for the FileUpload component
 */
interface FileUploadProps {
  /** Callback function called when files are selected */
  onFilesSelect: (files: FileAttachment[]) => void;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Maximum file size in bytes (default: 50MB for general files, 10MB for images) */
  maxSize?: number;
  /** Currently selected files */
  selectedFiles?: FileAttachment[];
  /** Additional CSS classes */
  className?: string;
  /** Accepted file types */
  acceptedTypes?: string[];
  /** Allow multiple file selection */
  multiple?: boolean;
}

/**
 * FileUpload component provides file picker functionality for multiple file types.
 * Features file validation, size limits, and support for images, text files, and documents.
 *
 * @param props - The component props
 * @returns JSX element representing the file upload interface
 */
export function FileUpload({
  onFilesSelect,
  disabled = false,
  maxSize = 50 * 1024 * 1024, // 50MB default
  selectedFiles = [],
  className,
  acceptedTypes = [
    'image/*',
    'text/*',
    'application/json',
    'application/pdf',
    '.md',
    '.csv',
    '.txt',
    '.json',
  ],
  multiple = true,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates a file
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size (different limits for images vs other files)
      const isImage = file.type.startsWith('image/');
      const fileSizeLimit = isImage ? 10 * 1024 * 1024 : maxSize; // 10MB for images, maxSize for others

      if (file.size > fileSizeLimit) {
        const maxSizeMB = Math.round(fileSizeLimit / (1024 * 1024));
        return `File "${file.name}" exceeds ${maxSizeMB}MB limit`;
      }

      // Check file type
      const allowedMimeTypes = [
        'image/',
        'text/',
        'application/json',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml',
      ];

      const isAllowedType = allowedMimeTypes.some((type) => file.type.startsWith(type));
      const hasAllowedExtension = ['.md', '.txt', '.csv', '.json'].some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!isAllowedType && !hasAllowedExtension) {
        return `File type "${file.type}" is not supported`;
      }

      return null;
    },
    [maxSize]
  );

  /**
   * Handles file selection
   */
  const handleFileSelect = useCallback(
    (files: FileList) => {
      const newFiles: FileAttachment[] = [];
      const errors: string[] = [];

      for (const file of Array.from(files)) {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
        } else {
          newFiles.push({
            file,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          });
        }
      }

      if (errors.length > 0) {
        setError(errors[0]); // Show first error
        return;
      }

      setError(null);

      if (multiple) {
        // Add to existing files
        onFilesSelect([...selectedFiles, ...newFiles]);
      } else {
        // Replace existing files
        onFilesSelect(newFiles);
      }
    },
    [validateFile, onFilesSelect, selectedFiles, multiple]
  );

  /**
   * Handles file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect]
  );

  /**
   * Handles drag over event
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  /**
   * Handles drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  /**
   * Handles drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [disabled, handleFileSelect]
  );

  /**
   * Handles click to open file picker
   */
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={cn('relative', className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        disabled={disabled}
        multiple={multiple}
        className="hidden"
      />

      {/* Upload Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'h-8 w-8 transition-colors',
          isDragOver && 'bg-primary/10',
          error && 'text-destructive'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Attach files"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-destructive z-10">{error}</div>
      )}
    </div>
  );
}
