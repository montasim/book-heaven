/**
 * Sound notification utilities
 */

// Pre-load audio elements to avoid delay when playing sounds
const soundCache = new Map<string, HTMLAudioElement>()

export function playNotificationSound(type: 'message' | 'offer' | 'default' = 'default') {
  try {
    // Get or create audio element
    let audio = soundCache.get(type)

    if (!audio) {
      // Use different notification sounds based on type
      // Using base64 data URIs to avoid external dependencies
      const sounds: Record<string, string> = {
        message: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU', // Short beep for messages
        offer: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU', // Chime for offers
        default: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'  // Default notification
      }

      // For now, use the Web Audio API to generate notification sounds
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      // Different tones for different notification types
      if (type === 'message') {
        oscillator.frequency.value = 800 // Higher pitch for messages
        gainNode.gain.value = 0.1
      } else if (type === 'offer') {
        oscillator.frequency.value = 600 // Lower pitch for offers
        gainNode.gain.value = 0.15
      } else {
        oscillator.frequency.value = 700 // Default pitch
        gainNode.gain.value = 0.1
      }

      oscillator.start()
      oscillator.stop(context.currentTime + 0.15) // Short beep

      return
    }

    // Reset audio to beginning if it was already played
    audio.currentTime = 0
    audio.play().catch(err => {
      console.log('Sound play failed:', err)
    })
  } catch (error) {
    // Silently fail if audio is not supported
    console.debug('Sound notification not available')
  }
}

/**
 * Request notification permission from the browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

/**
 * Show a browser notification
 */
export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })
  }
}
