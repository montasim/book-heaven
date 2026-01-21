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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-rose-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-rose-500/30 group-hover:scale-105 transition-all duration-300">
                <BookOpen className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">Book Heaven</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#featured" className="text-sm font-semibold text-slate-700 hover:text-rose-600 transition-colors">Featured</a>
              <a href="#categories" className="text-sm font-semibold text-slate-700 hover:text-rose-600 transition-colors">Categories</a>
              <a href="#new" className="text-sm font-semibold text-slate-700 hover:text-rose-600 transition-colors">New Arrivals</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/sign-in" className="text-sm font-semibold text-slate-700 hover:text-rose-600 transition-colors">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-gradient-to-r from-rose-500 to-orange-500 text-white px-5 py-2.5 rounded-2xl hover:from-rose-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 text-sm font-semibold"
              >
                Join
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-slate-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-rose-100/50 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              <a href="#featured" className="block text-sm font-semibold text-slate-900">Featured</a>
              <a href="#categories" className="block text-sm font-semibold text-slate-900">Categories</a>
              <a href="#new" className="block text-sm font-semibold text-slate-900">New Arrivals</a>
              <div className="pt-3 border-t border-rose-100/50 space-y-3">
                <Link href="/auth/sign-in" className="block text-sm font-semibold text-slate-900">Sign In</Link>
                <Link href="/sign-up" className="block bg-gradient-to-r from-rose-500 to-orange-500 text-white px-5 py-2.5 rounded-2xl text-center text-sm font-semibold">Join</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-400/30 to-orange-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-400/30 to-amber-400/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="text-xs font-black tracking-[0.2em] text-rose-600 uppercase bg-gradient-to-r from-rose-50 to-orange-50 px-4 py-2 rounded-full border-2 border-rose-100">
                  Your Digital Library
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-slate-900">
                Great stories
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500">belong to</span>
                <br />
                everyone
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-lg leading-relaxed font-medium">
                Discover thousands of books. Connect with fellow readers. Experience AI-powered reading assistance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/books"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white px-8 py-4 rounded-2xl hover:from-rose-600 hover:to-orange-600 transition-all shadow-xl hover:shadow-2xl hover:shadow-rose-500/30 hover:scale-105 font-bold text-lg"
                >
                  Explore Collection
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center border-2 border-slate-200 text-slate-800 px-8 py-4 rounded-2xl hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-semibold"
                >
                  Start Reading
                </Link>
              </div>

              {!loading && data && (
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200/60">
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {data.statistics.totalBooks.toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-slate-600 mt-1">Books</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {data.statistics.activeReaders.toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-slate-600 mt-1">Readers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {data.statistics.totalCategories}
                    </div>
                    <div className="text-sm font-semibold text-slate-600 mt-1">Categories</div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="aspect-[4/5] bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50 rounded-[2rem] overflow-hidden border-8 border-white shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 via-orange-100/50 to-amber-100/50 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="h-32 w-32 text-rose-400/30 mx-auto" strokeWidth={1} />
                    <p className="text-slate-500 text-sm font-medium mt-4">Your Reading Awaits</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-gradient-to-br from-rose-500 to-orange-500 rounded-[2rem] flex items-center justify-center p-6 shadow-2xl shadow-rose-500/30">
                <div className="text-center">
                  <div className="text-4xl font-black text-white leading-none tracking-tight">
                    {!loading && data && data.statistics.totalAuthors.toLocaleString()}
                  </div>
                  <div className="text-sm font-semibold text-rose-100 mt-2">Authors</div>
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
                <span className="text-xs font-black tracking-[0.2em] text-rose-600 uppercase">Curated</span>
                <h2 className="text-4xl font-black text-slate-900 mt-2 tracking-tight">Featured Books</h2>
              </div>
              <Link href="/books" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-rose-600 transition-colors group">
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
                  <div className="aspect-[2/3] bg-gradient-to-br from-slate-100 to-slate-200 mb-4 overflow-hidden border border-slate-200 rounded-2xl shadow-lg group-hover:shadow-2xl group-hover:shadow-rose-500/15 transition-all duration-300">
                    {book.image || book.directImageUrl ? (
                      <Image
                        src={getImageUrl(book.image, book.directImageUrl)}
                        alt={book.name}
                        width={400}
                        height={600}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-orange-100">
                        <BookOpen className="h-16 w-16 text-rose-300" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-black text-rose-600 uppercase tracking-wider">
                      {book.authors.map(a => a.name).join(', ')}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-tight">
                      {book.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span className="text-sm font-semibold text-slate-700">{book.readersCount}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-500">readers</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center sm:hidden">
              <Link
                href="/books"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-rose-600"
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
        <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-600 via-orange-600 to-amber-500 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>

          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-12">
              <span className="text-xs font-black tracking-[0.2em] text-rose-100 uppercase">Browse</span>
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
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rose-100 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm font-medium text-rose-100">
                        {category.bookCount} books
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-rose-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {!loading && data && data.recentBooks.length > 0 && (
        <section id="new" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-rose-50/40 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs font-black tracking-[0.2em] text-rose-600 uppercase">Fresh</span>
                <h2 className="text-4xl font-black text-slate-900 mt-2 tracking-tight">New Arrivals</h2>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.recentBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="group"
                >
                  <div className="aspect-[2/3] bg-gradient-to-br from-slate-200 to-slate-300 mb-4 overflow-hidden border border-slate-300 rounded-xl shadow-md group-hover:shadow-xl group-hover:shadow-rose-500/15 transition-all duration-300">
                    {book.image || book.directImageUrl ? (
                      <Image
                        src={getImageUrl(book.image, book.directImageUrl)}
                        alt={book.name}
                        width={300}
                        height={450}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-200 to-orange-200">
                        <BookOpen className="h-12 w-12 text-rose-400" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-tight">
                      {book.name}
                    </h3>
                    <p className="text-sm font-medium text-slate-600">
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
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-600 via-orange-600 to-amber-500 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[0.95] tracking-tight mb-6">
            Start your reading
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-amber-200">journey today</span>
          </h2>
          <p className="text-lg text-rose-50/90 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands of readers discovering their next favorite book on Book Heaven
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-white text-rose-600 px-10 py-4 rounded-2xl hover:bg-orange-50 transition-all shadow-2xl hover:shadow-3xl hover:shadow-rose-900/50 hover:scale-105 font-bold text-lg"
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
      <footer className="bg-gradient-to-br from-slate-900 via-rose-950 to-orange-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-lg font-black">Book Heaven</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Your personal library, reimagined for the digital age
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white text-sm tracking-wide uppercase">Discover</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/books" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Books</Link></li>
                <li><Link href="/marketplace" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Marketplace</Link></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Blog</Link></li>
                <li><Link href="/quiz" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Quiz</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white text-sm tracking-wide uppercase">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help-center" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Help Center</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Contact</Link></li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-white text-sm tracking-wide uppercase">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-rose-400 transition-colors font-medium">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-500">
            <p className="font-medium">© 2025 Book Heaven. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
