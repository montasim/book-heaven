'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/books/search-bar'
import { ThemeSwitch } from '@/components/theme-switch'
import { Search } from '@/components/search'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { TopNav } from './top-nav'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, User, Settings, LogOut, CreditCard, Brain, ChevronDown, ShoppingBag, MessageSquare } from 'lucide-react'
import {useAuth} from "@/context/auth-context";
import { getUserInitials } from '@/lib/utils/user'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ROUTES } from '@/lib/routes/client-routes'

interface UserTopbarProps {
  className?: string
  showSearch?: boolean
  showSidebarToggle?: boolean
  topNavLinks?: Array<{
    title: string
    href: string
    isActive?: boolean
    disabled?: boolean
  }>
}

export function UserTopbar({
  className,
  showSearch = true,
  showSidebarToggle = false,
  topNavLinks,
  ...props
}: UserTopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [siteName, setSiteName] = useState('Book Heaven')

  useEffect(() => {
    // Fetch site name from public API
    fetch('/api/public/site/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.siteName) {
          setSiteName(data.data.siteName)
        }
      })
      .catch(console.error)
  }, [])

  const handleLogout = () => {
    setIsLogoutDialogOpen(true)
  }

  const confirmLogout = async () => {
    setIsLogoutDialogOpen(false)
    await logout()
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const renderUserMenu = () => (
    <div className="flex items-center gap-3">
      {/* Search Bar - Desktop */}
      {showSearch && (
        <div className="hidden md:block flex-1 max-w-md">
          {showSidebarToggle ? (
            /* Admin dashboard - use Search component */
            <Search />
          ) : user ? (
            /* Public pages with logged-in user */
            <SearchBar placeholder="Search books, authors, or categories..." />
          ) : (
            /* Public pages with logged-out user */
            <SearchBar placeholder="Search books, authors, or categories..." />
          )}
        </div>
      )}

      <ThemeSwitch />

      {/* Notification Bell - only show for logged in users */}
      {user && <NotificationBell />}

      {/* User Profile or Auth Buttons */}
      <div className="flex items-center space-x-2">
        {isLoading ? (
          /* Show skeleton buttons during loading */
          <>
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </>
        ) : user ? (
          /* User is logged in - show profile dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {/* Navigation Section */}
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.books.href} className="w-full cursor-pointer lg:hidden">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Books
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.marketplace.href} className="w-full cursor-pointer lg:hidden">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Marketplace
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.quiz.href} className="w-full cursor-pointer lg:hidden">
                    <Brain className="mr-2 h-4 w-4" />
                    Quiz Game
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-primary/10 text-primary'
                      }`}
                      title={`Raw role: ${user.role}`}
                    >
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : user.role}
                    </span>
                    {user.isPremium && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={ROUTES.messages.href} className="w-full cursor-pointer">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Messages
                    </Link>
                </DropdownMenuItem>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => handleNavigation('/settings/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                {
                    !isAdmin && <DropdownMenuItem onClick={() => handleNavigation(ROUTES.library.href)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        My Library
                    </DropdownMenuItem>
                }
                <DropdownMenuItem onClick={() => handleNavigation(ROUTES.settingsBilling.href)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation(ROUTES.settings.href)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* User is not logged in - show sign in/up buttons */
          <>
            <Link href={ROUTES.signIn.href}>
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href={ROUTES.signUpSimple.href}>
              <Button>Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      <header
        className={cn(
          'flex items-center gap-3 sm:gap-4 bg-background p-4 h-16 relative',
          className
        )}
        {...props}
      >
        {showSidebarToggle && (
          <SidebarTrigger variant='outline' className='scale-125 sm:scale-100' />
        )}

        {/* TopNav for dashboard - grouped with sidebar toggle */}
        {topNavLinks && <TopNav links={topNavLinks} />}

        {/* Logo for public pages */}
        {!showSidebarToggle && (
          <div className="flex items-center space-x-2">
            <Link href={ROUTES.home.href} className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold hidden sm:block">{siteName}</h1>
            </Link>
          </div>
        )}

        {/* Desktop Navigation Links */}
        {!showSidebarToggle && user && (
          <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <Link
              href={ROUTES.books.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                pathname?.startsWith('/books')
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-primary hover:bg-accent"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <span>Books</span>
            </Link>
            <Link
              href={ROUTES.marketplace.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                pathname?.startsWith('/marketplace')
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-primary hover:bg-accent"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Marketplace</span>
            </Link>
            <Link
              href={ROUTES.quiz.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                pathname?.startsWith('/quiz')
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-primary hover:bg-accent"
              )}
            >
              <Brain className="h-4 w-4" />
              <span>Quiz</span>
            </Link>
          </nav>
        )}

        <div className="flex-1" />
        {renderUserMenu()}
      </header>

      <ConfirmDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        title="Log out"
        desc="Are you sure you want to log out? You will need to sign in again to access your account."
        cancelBtnText="Cancel"
        confirmText="Log out"
        handleConfirm={confirmLogout}
      />
    </>
  )
}

UserTopbar.displayName = 'UserTopbar'
