import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteUser, checkEmailAvailability } from '../actions' // Import checkEmailAvailability
import { IconMailPlus, IconSend, IconLoader2, IconCheck, IconX } from '@tabler/icons-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'
import { userTypes } from '../data/data'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Email is invalid.' }),
  role: z.string().min(1, { message: 'Role is required.' }),
  desc: z.string().optional(),
})
type UserInviteForm = z.infer<typeof formSchema>

interface UsersInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersInviteDialog({ open, onOpenChange }: UsersInviteDialogProps) {
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailAvailability, setEmailAvailability] = useState<{
    available: boolean
    message?: string
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', role: '', desc: '' },
    mode: 'onChange', // Validate on change to enable button state update
  })

  // Watch email field for changes
  const emailValue = form.watch('email')

  // Debounce email check
  useEffect(() => {
    const checkEmail = async () => {
      // Clear previous status
      setEmailAvailability(null)

      // Only check if email is valid according to zod schema
      const isEmailFormatValid = await form.trigger('email')
      if (!emailValue || !isEmailFormatValid) return

      setIsCheckingEmail(true)
      try {
        const result = await checkEmailAvailability(emailValue)
        if (result.isAvailable) {
          setEmailAvailability({ available: true })
        } else {
          setEmailAvailability({
            available: false,
            message: result.error || 'Email is not available'
          })
          // Also set form error manually so isValid becomes false
          form.setError('email', {
            type: 'manual',
            message: result.error || 'Email is not available'
          })
        }
      } catch (error) {
        console.error('Email check failed:', error)
      } finally {
        setIsCheckingEmail(false)
      }
    }

    const timeoutId = setTimeout(() => {
      if (emailValue) checkEmail()
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [emailValue, form])

  const onSubmit = async (values: UserInviteForm) => {
    // Prevent submission if email is not available
    if (emailAvailability?.available === false) return

    try {
      const response = await fetch('/api/auth/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      toast({
        title: 'Success',
        description: 'User invited successfully',
      })
      form.reset()
      setEmailAvailability(null)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  // Check if button should be disabled
  // Disabled if: form invalid OR checking email OR email unavailable
  const isSubmitDisabled = !form.formState.isValid || isCheckingEmail || (emailAvailability?.available === false)

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset()
          setEmailAvailability(null)
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-left'>
          <DialogTitle className='flex items-center gap-2'>
            <IconMailPlus /> Invite User
          </DialogTitle>
          <DialogDescription>
            Invite new user to join your team by sending them an email
            invitation. Assign a role to define their access level.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='user-invite-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type='email'
                        placeholder='eg: john.doe@gmail.com'
                        {...field}
                        className={cn(
                          emailAvailability?.available === false && "border-red-500 focus-visible:ring-red-500",
                          emailAvailability?.available === true && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingEmail && <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!isCheckingEmail && emailAvailability?.available === true && <IconCheck className="h-4 w-4 text-green-500" />}
                        {!isCheckingEmail && emailAvailability?.available === false && <IconX className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                  {/* Additional explicit message if needed, though FormMessage covers manual errors too */}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select a role'
                    items={userTypes.map(({ label, value }) => ({
                      label,
                      value,
                    }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='desc'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Short description regarding the user.' rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button type='submit' form='user-invite-form' disabled={isSubmitDisabled}>
            Invite <IconSend className='ml-2 h-4 w-4' />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
