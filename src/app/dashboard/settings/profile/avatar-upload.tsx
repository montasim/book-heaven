"use client"

import { useState, useRef, useEffect } from 'react'
import { uploadAvatar, getAvatarUrl } from './actions'
import { toast } from '@/hooks/use-toast'
import { Loader2, Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/auth-context'

export function AvatarUpload() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refreshUser } = useAuth()

  useEffect(() => {
    async function loadAvatar() {
      setIsLoading(true)
      try {
        const { avatarUrl } = await getAvatarUrl()
        setAvatarUrl(avatarUrl)
      } catch (error) {
        console.error('Failed to load avatar:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAvatar()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'image/png') {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PNG format is allowed'
      })
      return
    }

    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'File size must be under 1MB'
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const result = await uploadAvatar(formData)
      if (result.success) {
        setAvatarUrl(result.avatarUrl)
        // Refresh user data to update avatar in topbar and sidebar
        await refreshUser()
        toast({
          title: 'Success',
          description: result.message
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload avatar'
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-start gap-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={avatarUrl || undefined} alt="Profile picture" />
        <AvatarFallback className="text-2xl">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            'U'
          )}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div>
          <h3 className="font-medium">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Upload a PNG image under 1MB
          </p>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>

          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                window.open(avatarUrl, '_blank')
              }}
            >
              <Camera className="mr-2 h-4 w-4" />
              View
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Accepts PNG format only, max 1MB
        </p>
      </div>
    </div>
  )
}
