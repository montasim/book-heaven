// Server-only configuration
const serverConfig = {
  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  get isDevelopment() {
    return this.nodeEnv !== 'production'
  },
  get isProduction() {
    return this.nodeEnv === 'production'
  },

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.FROM_EMAIL,

  // URLs
  baseUrl: process.env.BASE_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,

  // Google Drive
  google: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
} as const

// Public configuration (can be used in client components)
export const publicConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
} as const

// Full server config
export const config = serverConfig

// Type exports
export type Config = typeof serverConfig
