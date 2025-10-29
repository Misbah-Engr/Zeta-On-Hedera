import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null

async function loadTurnstileScript() {
  if (typeof window === 'undefined') return
  if (window.turnstile) return
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('turnstile_load_failed'))
      }
      document.head.appendChild(script)
    })
  }
  await scriptPromise
}

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess: (token: string) => void
  onError?: () => void
  appearance?: 'always' | 'execute' | 'interaction-only'
}

export const TurnstileWidget = ({ siteKey, onSuccess, onError, appearance = 'always' }: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!siteKey) return
    let widgetId: string | undefined
    let cancelled = false

    const renderWidget = async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onSuccess(token),
          'error-callback': () => onError?.(),
          'expired-callback': () => onError?.(),
          appearance
        })
      } catch (error) {
        console.error('turnstile_init_failed', error)
        onError?.()
      }
    }

    renderWidget()

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [siteKey, onSuccess, onError, appearance])

  return <div ref={containerRef} className="turnstile-container" />
}
