import { google } from 'googleapis'
import { Readable } from 'stream'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

// Initialize Google Drive API
// Ensure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are set in .env
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
})

const drive = google.drive({ version: 'v3', auth })

/**
 * Upload a file to Google Drive
 * @param file The file object to upload
 * @param folderId Optional folder ID to upload to
 * @returns The webViewLink (URL) of the uploaded file
 */
export async function uploadFile(file: File, folderId?: string): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(buffer)

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        mimeType: file.type,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
    })

    // Make the file publicly readable (optional, depending on requirements)
    // await drive.permissions.create({
    //   fileId: response.data.id!,
    //   requestBody: {
    //     role: 'reader',
    //     type: 'anyone',
    //   },
    // })

    // We return the webViewLink which is a viewable URL. 
    // For direct download, webContentLink could be used.
    // We also append the ID to the URL or return an object if we need to store the ID for deletion.
    // To simplify storage, we can store the ID in the URL or just store the ID.
    // However, the current schema expects a URL string.
    // A common strategy is to store the ID, but the UI expects a URL.
    // Let's store the webViewLink. To delete, we'll need to extract the ID from the URL or store the ID separately.
    // Since we can't easily change the schema to add a separate ID field without migration, 
    // we will try to extract the ID from the URL when deleting.
    
    return response.data.webViewLink || ''
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error)
    throw new Error('Failed to upload file to Google Drive')
  }
}

/**
 * Delete a file from Google Drive
 * @param fileUrl The URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl) return false

  try {
    // Extract ID from URL
    // Google Drive URLs are typically: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
    const match = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
    const fileId = match ? match[1] : null

    if (!fileId) {
      console.warn('Could not extract file ID from URL:', fileUrl)
      return false
    }

    await drive.files.delete({
      fileId,
    })
    return true
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error)
    return false
  }
}
