'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, ArrowRight, Star, Menu, X } from 'lucide-react'

interface LandingData {
  statistics: {
    totalBooks: number
    totalUsers: number
    totalCategories: number
    totalAuthors: number
    totalPublications: number
    activeReaders: number
    premiumBooks: number
    recentBooksCount: number
  }
  featuredBooks: Array<{
    id: string
    name: string
    image: string | null
    directImageUrl: string | null
    readersCount: number
    authors: Array<{ name: string }>
  }>
  popularCategories: Array<{
    id: string
    name: string
    bookCount: number
  }>
  recentBooks: Array<{
    id: string
    name: string
    image: string | null
    directImageUrl: string | null
    authors: Array<{ name: string }>
  }>
}

export default function LandingPage() {
  const [data, setData] = useState<LandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/public/landing')
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (error) {
        console.error('Failed to fetch landing data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getImageUrl = (image: string | null, directUrl: string | null) => {
    return directUrl || image || '/placeholder-book.jpg'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50/30 to-amber-50/20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-orange-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-orange-500/40 group-hover:scale-105 transition-all duration-300">
                <BookOpen className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-orange-700 to-amber-800 bg-clip-text text-transparent">Book Heaven</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#featured" className="text-sm font-semibold text-stone-700 hover:text-orange-700 transition-colors">Featured</a>
              <a href="#categories" className="text-sm font-semibold text-stone-700 hover:text-orange-700 transition-colors">Categories</a>
              <a href="#new" className="text-sm font-semibold text-stone-700 hover:text-orange-700 transition-colors">New Arrivals</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/sign-in" className="text-sm font-semibold text-stone-700 hover:text-orange-700 transition-colors">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-orange-600 to-amber-700 text-white px-5 py-2.5 rounded-2xl hover:from-orange-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg hover:shadow-orange-500/40 hover:scale-105 text-sm font-semibold"
              >
                Join
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-stone-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-orange-100/50 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              <a href="#featured" className="block text-sm font-semibold text-stone-900">Featured</a>
              <a href="#categories" className="block text-sm font-semibold text-stone-900">Categories</a>
              <a href="#new" className="block text-sm font-semibold text-stone-900">New Arrivals</a>
              <div className="pt-3 border-t border-orange-100/50 space-y-3">
                <Link href="/auth/sign-in" className="block text-sm font-semibold text-stone-900">Sign In</Link>
                <Link href="/sign-up" className="block bg-gradient-to-r from-orange-600 to-amber-700 text-white px-5 py-2.5 rounded-2xl text-center text-sm font-semibold">Join</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-400/25 to-amber-400/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-400/25 to-yellow-400/25 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="text-xs font-black tracking-[0.2em] text-orange-700 uppercase bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 rounded-full border-2 border-orange-200">
                  Your Digital Library
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-stone-900">
                Great stories
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600">belong to</span>
                <br />
                everyone
              </h1>

              <p className="text-lg sm:text-xl text-stone-600 max-w-lg leading-relaxed font-medium">
                Discover thousands of books. Connect with fellow readers. Experience AI-powered reading assistance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/books"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-700 text-white px-8 py-4 rounded-2xl hover:from-orange-700 hover:to-amber-800 transition-all shadow-xl hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-105 font-bold text-lg"
                >
                  Explore Collection
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center border-2 border-stone-300 text-stone-800 px-8 py-4 rounded-2xl hover:border-orange-400 hover:text-orange-700 hover:bg-orange-50 transition-all font-semibold"
                >
                  Start Reading
                </Link>
              </div>

              {!loading && data && (
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-stone-200/60">
                  <div>
                    <div className="text-3xl font-black text-stone-900 tracking-tight">
                      {data.statistics.totalBooks.toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-stone-600 mt-1">Books</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-stone-900 tracking-tight">
                      {data.statistics.activeReaders.toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-stone-600 mt-1">Readers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-stone-900 tracking-tight">
                      {data.statistics.totalCategories}
                    </div>
                    <div className="text-sm font-semibold text-stone-600 mt-1">Categories</div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              {/* Book Stack Display */}
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50" />

                {/* Featured Books Stack */}
                {!loading && data && data.featuredBooks.length > 0 ? (
                  <div className="absolute inset-0 p-8 flex items-center justify-center">
                    {data.featuredBooks.slice(0, 4).map((book, index) => {
                      const imageUrl = getImageUrl(book.image, book.directImageUrl)
                      const hasImage = book.image || book.directImageUrl

                      return (
                        <div
                          key={book.id}
                          className="absolute transition-all duration-500 ease-out hover:z-20 group cursor-pointer"
                          style={{
                            transform: `
                              translateX(${(index - 1.5) * 40}px)
                              translateY(${Math.abs(index - 1.5) * 20}px)
                              rotate(${(index - 1.5) * 8}deg)
                            `,
                            zIndex: 10 - index,
                            filter: `
                              brightness(${1 - index * 0.1})
                              drop-shadow(${index * 4}px ${index * 8}px ${20 + index * 10}px rgba(0,0,0,0.15))
                            `
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = `
                              translateX(${(index - 1.5) * 20}px)
                              translateY(${Math.abs(index - 1.5) * 10}px)
                              rotate(${(index - 1.5) * 4}deg)
                              scale(1.05)
                            `
                            e.currentTarget.style.filter = 'brightness(1) drop-shadow(0 20px 40px rgba(0,0,0,0.3))'
                            e.currentTarget.style.zIndex = '30'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = `
                              translateX(${(index - 1.5) * 40}px)
                              translateY(${Math.abs(index - 1.5) * 20}px)
                              rotate(${(index - 1.5) * 8}deg)
                            `
                            e.currentTarget.style.filter = `
                              brightness(${1 - index * 0.1})
                              drop-shadow(${index * 4}px ${index * 8}px ${20 + index * 10}px rgba(0,0,0,0.15))
                            `
                            e.currentTarget.style.zIndex = `${10 - index}`
                          }}
                        >
                          <Link href={`/books/${book.id}`}>
                            <div
                                                              className={`
                              w-56 h-80 rounded-2xl overflow-hidden border-4 border-white
                              ${hasImage ? 'bg-white' : 'bg-gradient-to-br from-orange-200 to-amber-200'}
                              shadow-xl transition-shadow duration-300
                              group-hover:shadow-2xl
                            `}
                            >
                              {hasImage ? (
                                <Image
                                  src={imageUrl}
                                  alt={book.name}
                                  width={224}
                                  height={320}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="h-20 w-20 text-orange-400/40" strokeWidth={1} />
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Loading/Empty State */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="relative w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                          {loading ? (
                            <BookOpen className="h-16 w-16 text-orange-400/50 animate-pulse" strokeWidth={1} />
                          ) : (
                            <BookOpen className="h-16 w-16 text-orange-400/50" strokeWidth={1} />
                          )}
                        </div>
                      </div>
                      <p className="text-stone-500 text-sm font-medium">
                        {loading ? 'Loading books...' : 'Your Reading Awaits'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Decorative border */}
                <div className="absolute inset-0 rounded-[2rem] border-8 border-white/40" />
              </div>

              {/* Authors Badge */}
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-gradient-to-br from-orange-600 to-amber-700 rounded-[2rem] flex items-center justify-center p-6 shadow-2xl shadow-orange-500/40">
                <div className="text-center">
                  <div className="text-4xl font-black text-white leading-none tracking-tight">
                    {!loading && data ? data.statistics.totalAuthors.toLocaleString() : '—'}
                  </div>
                  <div className="text-sm font-semibold text-orange-100 mt-2">Authors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      {!loading && data && data.featuredBooks.length > 0 && (
        <section id="featured" className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs font-black tracking-[0.2em] text-orange-700 uppercase">Curated</span>
                <h2 className="text-4xl font-black text-stone-900 mt-2 tracking-tight">Featured Books</h2>
              </div>
              <Link href="/books" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-orange-700 transition-colors group">
                View All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.featuredBooks.slice(0, 6).map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="group"
                >
                  <div className="aspect-[2/3] bg-gradient-to-br from-stone-100 to-stone-200 mb-4 overflow-hidden border border-stone-200 rounded-2xl shadow-lg group-hover:shadow-2xl group-hover:shadow-orange-500/15 transition-all duration-300">
                    {book.image || book.directImageUrl ? (
                      <Image
                        src={getImageUrl(book.image, book.directImageUrl)}
                        alt={book.name}
                        width={400}
                        height={600}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                        <BookOpen className="h-16 w-16 text-orange-300" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-black text-orange-700 uppercase tracking-wider">
                      {book.authors.map(a => a.name).join(', ')}
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 group-hover:text-orange-700 transition-colors line-clamp-2 leading-tight">
                      {book.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span className="text-sm font-semibold text-stone-700">{book.readersCount}</span>
                      </div>
                      <span className="text-sm font-medium text-stone-500">readers</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center sm:hidden">
              <Link
                href="/books"
                className="inline-flex items-center gap-2 text-sm font-semibold text-stone-900 hover:text-orange-700"
              >
                View All Books
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {!loading && data && data.popularCategories.length > 0 && (
        <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-700 via-amber-700 to-yellow-600 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>

          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-12">
              <span className="text-xs font-black tracking-[0.2em] text-orange-100 uppercase">Browse</span>
              <h2 className="text-4xl font-black text-white mt-2 tracking-tight">Categories</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.popularCategories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/books?category=${category.id}`}
                  className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all p-6 border border-white/20 hover:border-white/30 rounded-2xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-100 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm font-medium text-orange-100">
                        {category.bookCount} books
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-amber-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {!loading && data && data.recentBooks.length > 0 && (
        <section id="new" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-stone-50 to-orange-50/40 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs font-black tracking-[0.2em] text-orange-700 uppercase">Fresh</span>
                <h2 className="text-4xl font-black text-stone-900 mt-2 tracking-tight">New Arrivals</h2>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.recentBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="group"
                >
                  <div className="aspect-[2/3] bg-gradient-to-br from-stone-200 to-stone-300 mb-4 overflow-hidden border border-stone-300 rounded-xl shadow-md group-hover:shadow-xl group-hover:shadow-orange-500/15 transition-all duration-300">
                    {book.image || book.directImageUrl ? (
                      <Image
                        src={getImageUrl(book.image, book.directImageUrl)}
                        alt={book.name}
                        width={300}
                        height={450}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-amber-200">
                        <BookOpen className="h-12 w-12 text-orange-400" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-orange-700 transition-colors line-clamp-2 leading-tight">
                      {book.name}
                    </h3>
                    <p className="text-sm font-medium text-stone-600">
                      {book.authors.map(a => a.name).join(', ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-700 via-amber-700 to-yellow-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[0.95] tracking-tight mb-6">
            Start your reading
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-200">journey today</span>
          </h2>
          <p className="text-lg text-orange-50/90 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands of readers discovering their next favorite book on Book Heaven
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-700 px-10 py-4 rounded-2xl hover:bg-orange-50 transition-all shadow-2xl hover:shadow-3xl hover:shadow-orange-900/50 hover:scale-105 font-bold text-lg"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center justify-center border-2 border-white/30 text-white px-10 py-4 rounded-2xl hover:bg-white/10 hover:border-white/50 transition-all font-semibold text-lg backdrop-blur-sm"
            >
              Browse Books
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-stone-900 via-orange-950 to-amber-950 text-stone-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-lg font-black">Book Heaven</span>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed font-medium">
                Your personal library, reimagined for the digital age
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white text-sm tracking-wide uppercase">Discover</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/books" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Books</Link></li>
                <li><Link href="/marketplace" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Marketplace</Link></li>
                <li><Link href="/blog" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Blog</Link></li>
                <li><Link href="/quiz" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Quiz</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white text-sm tracking-wide uppercase">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help-center" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Help Center</Link></li>
                <li><Link href="/contact" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Contact</Link></li>
                <li><Link href="/pricing" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white text-sm tracking-wide uppercase">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-stone-400 hover:text-orange-400 transition-colors font-medium">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-800 mt-12 pt-8 text-center text-sm text-stone-500">
            <p className="font-medium">© 2025 Book Heaven. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
