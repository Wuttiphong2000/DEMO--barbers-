'use client'

import { useState, useEffect } from 'react'

export interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

interface LiffState {
  ready: boolean
  profile: LiffProfile | null
  error: string | null
}

export function useLiff(): LiffState {
  const [state, setState] = useState<LiffState>({ ready: false, profile: null, error: null })

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID

    if (!liffId) {
      // Development mode: use a mock profile
      setState({
        ready: true,
        profile: { userId: 'U_dev_mock_001', displayName: 'Dev User' },
        error: null,
      })
      return
    }

    import('@line/liff').then(async ({ default: liff }) => {
      try {
        await liff.init({ liffId })

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const profile = await liff.getProfile()
        setState({
          ready: true,
          profile: { userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl },
          error: null,
        })
      } catch {
        // Outside LINE env — fallback to mock for development
        setState({
          ready: true,
          profile: { userId: 'U_dev_mock_001', displayName: 'Dev User' },
          error: null,
        })
      }
    })
  }, [])

  return state
}
