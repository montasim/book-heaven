'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { useToast } from '@/hooks/use-toast'

interface ImageUploadProps {
  disabled?: boolean
  onChange: (value: File | null) => void
  onRemove: () => void
  value?: File | string | null
  directUrl?: string | null // Direct URL for faster image loading
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
  directUrl,
}) => {
  const [isMounted, setIsMounted] = useState(true)
  const [preview, setPreview] = useState<string | null>(() => {
    // Initialize preview from value
    if (value instanceof File) {
      return URL.createObjectURL(value)
    } else if (typeof value === 'string') {
      const proxiedUrl = getProxiedImageUrl(value)
      return proxiedUrl || (directUrl && directUrl.trim() !== '' ? directUrl : value)
    }
    return null
  })
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Synchronize preview with value prop
  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value)
      startTransition(() => {
        setPreview(objectUrl)
      })
      return () => URL.revokeObjectURL(objectUrl)
    } else if (typeof value === 'string') {
      // Use proxied URL for Google Drive images (better compatibility)
      // For non-Google Drive URLs, use directUrl if available
      const proxiedUrl = getProxiedImageUrl(value)
      const urlToUse = proxiedUrl || (directUrl && directUrl.trim() !== '' ? directUrl : value)
      startTransition(() => {
        setPreview(urlToUse)
      })
    } else {
      startTransition(() => {
        setPreview(null)
      })
    }
  }, [value, directUrl])

  if (!isMounted) {
    return null
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null

    // Validate file type - PNG only
    if (file && file.type !== 'image/png') {
      toast({
        variant: 'destructive',
        title: 'Invalid file format',
        description: 'Only PNG images are allowed. Please upload a PNG file.',
      })
      // Clear the input
      event.target.value = ''
      return
    }

    onChange(file)
  }

  return (
    <div>
      {preview ? (
        <div className='relative h-32 w-32'>
          <Image
            src={preview}
            alt='Image preview'
            fill
            className='rounded-md object-cover'
            sizes='128px'
            unoptimized
          />
          <div className='absolute top-0 right-0'>
            <Button type='button' onClick={onRemove} variant='destructive' size='icon' disabled={disabled}>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex items-center justify-center h-32 w-32 border-2 border-dashed rounded-md overflow-hidden'>
          <label className='flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-accent transition-colors'>
            <ImageIcon className='h-8 w-8 text-gray-400' />
            <span className='text-xs text-center text-gray-500 px-1'>Upload PNG</span>
            <Input
              type='file'
              className='hidden'
              onChange={handleFileChange}
              accept='image/png'
              disabled={disabled}
            />
          </label>
        </div>
      )}
    </div>
  )
}
