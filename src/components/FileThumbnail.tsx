import React, { useEffect, useState } from 'react';
import {
  FileArchive,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { getAuthorizedFileUrl } from '../services/api';
import type { VaultFile } from '../types/vault';

interface FileThumbnailProps {
  file: VaultFile;
  size?: 'sm' | 'md' | 'banner';
  onClick?: () => void;
  className?: string;
}

export function resolveVaultImageUrl(file: VaultFile): string {
  if (
    file.previewUrl &&
    !file.previewUrl.startsWith('/api/files/') &&
    !file.previewUrl.startsWith('/src/')
  ) {
    return file.previewUrl;
  }
  return getAuthorizedFileUrl(file.id, false);
}

export const FileThumbnail: React.FC<FileThumbnailProps> = ({
  file,
  size = 'md',
  onClick,
  className = '',
}) => {
  const [broken, setBroken] = useState(false);

  const mime = file?.mimeType || '';
  const fileName = file?.name || '';
  const isImage =
    file?.category === 'image' ||
    mime.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(fileName);

  useEffect(() => {
    setBroken(false);
  }, [file.id, file.previewUrl]);

  const Icon =
    file.category === 'image'
      ? ImageIcon
      : file.category === 'archive'
      ? FileArchive
      : file.category === 'media'
      ? Film
      : file.category === 'design'
      ? Layers
      : FileText;

  const sizeStyles =
    size === 'banner'
      ? 'h-32 w-full rounded-xl'
      : size === 'sm'
      ? 'h-9 w-9 rounded-lg'
      : 'h-11 w-11 rounded-xl';

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'banner' ? 'h-8 w-8' : 'h-5 w-5';

  const content =
    isImage && !broken ? (
      <img
        src={resolveVaultImageUrl(file)}
        alt={file.name}
        onError={() => setBroken(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    ) : (
      <Icon className={`${iconSize} text-[#00D9FF]`} />
    );

  const baseClass = `group relative flex shrink-0 items-center justify-center overflow-hidden border border-[#00D9FF]/35 bg-[#051B44]/60 ${sizeStyles} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Preview ${file.name}`}
        className={`${baseClass} cursor-pointer hover:border-[#00D9FF]/75 transition-colors`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
};

interface LocalFileThumbProps {
  file: File;
}

export const LocalFileThumb: React.FC<LocalFileThumbProps> = ({ file }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const isImage =
    file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(file.name);

  useEffect(() => {
    if (!isImage) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  if (!isImage || !objectUrl) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#22E6D0]/35 bg-[#22E6D0]/12 text-[#22E6D0]">
        <FileText className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#00D9FF]/45 bg-[#051B44]/60">
      <img src={objectUrl} alt={file.name} className="h-full w-full object-cover" />
    </span>
  );
};
