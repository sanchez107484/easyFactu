'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TeamMemberAvatarProps {
  imageUrl: string;
  name: string;
  size?: 'sm' | 'lg';
  className?: string;
}

export function TeamMemberAvatar({
  imageUrl,
  name,
  size = 'sm',
  className = '',
}: TeamMemberAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('');

  if (imageError || !imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white ${
          size === 'lg' ? 'h-full w-full text-6xl' : 'h-full w-full text-5xl'
        } ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={name}
      fill
      className={`object-cover ${className}`}
      onError={() => setImageError(true)}
      priority={size === 'lg'}
    />
  );
}
