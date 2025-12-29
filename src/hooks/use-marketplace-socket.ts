'use client'

/**
 * useMarketplaceSocket Hook
 *
 * Connects to external Socket.io server on Render
 * Manages real-time offer updates for a specific sell post
 */

import { useEffect, useCallback, useRef } from 'react'
import { useWebSocket } from '@/context/websocket-context'
import { useAuth } from '@/context/auth-context'

interface UseMarketplaceSocketOptions {
  sellPostId: string
  sellerId: string
  onNewOffer?: (data: { sellPostId: string; offer: any; sellerId: string }) => void
  onOfferUpdated?: (data: { offerId: string; status: string; sellPostId: string; offer: any }) => void
  onNewMessage?: (message: any) => void
}

export function useMarketplaceSocket({
  sellPostId,
  sellerId,
  onNewOffer,
  onOfferUpdated,
  onNewMessage
}: UseMarketplaceSocketOptions) {
  const { user } = useAuth()
  const ws = useWebSocket()

  const cleanupNewOffer = useRef<(() => void) | null>(null)
  const cleanupOfferUpdated = useRef<(() => void) | null>(null)
  const cleanupNewMessage = useRef<(() => void) | null>(null)

  // Setup event listeners
  useEffect(() => {
    if (!ws.socket) return

    // New offer listener - only for seller
    cleanupNewOffer.current = ws.onNewOffer((data) => {
      if (data.sellPostId === sellPostId && user?.id === sellerId) {
        onNewOffer?.(data)
      }
    })

    // Offer update listener - for buyer
    cleanupOfferUpdated.current = ws.onOfferUpdated((data) => {
      if (data.sellPostId === sellPostId) {
        onOfferUpdated?.(data)
      }
    })

    // New message listener - for both seller and buyer
    cleanupNewMessage.current = ws.onNewMessage((message) => {
      onNewMessage?.(message)
    })

    return () => {
      cleanupNewOffer.current?.()
      cleanupOfferUpdated.current?.()
      cleanupNewMessage.current?.()
    }
  }, [ws.socket, sellPostId, sellerId, user?.id, ws, onNewOffer, onOfferUpdated, onNewMessage])

  return {
    isConnected: ws.isConnected
  }
}
