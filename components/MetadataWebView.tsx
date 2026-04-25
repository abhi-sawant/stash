import React, { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

import { UrlMetadata } from '../lib/types'
import { getFaviconUrl } from '../lib/utils'

interface Props {
  url: string
  onResult: (metadata: UrlMetadata) => void
  onError: () => void
  timeoutMs?: number
}

// Injected after page load — reads meta tags and posts back a JSON result
const INJECT_SCRIPT = `
(function() {
  function getMeta(property) {
    var el = document.querySelector('meta[property="' + property + '"]') ||
              document.querySelector('meta[name="' + property + '"]');
    return el ? el.getAttribute('content') || '' : '';
  }
  function resolveUrl(raw) {
    if (!raw) return '';
    if (/^https?:\\/\\//i.test(raw)) return raw;
    if (raw.startsWith('//')) return 'https:' + raw;
    try { return new URL(raw, window.location.href).href; } catch(e) { return ''; }
  }
  var title = getMeta('og:title') || getMeta('twitter:title') || document.title || '';
  var description = getMeta('og:description') || getMeta('description') || getMeta('twitter:description') || '';
  var imageUrl = resolveUrl(getMeta('og:image') || getMeta('twitter:image') || '');
  window.ReactNativeWebView.postMessage(JSON.stringify({ title: title, description: description, imageUrl: imageUrl }));
})();
true;
`

export default function MetadataWebView({ url, onResult, onError, timeoutMs = 12000 }: Props) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resolvedRef = useRef(false)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (!resolvedRef.current) {
        resolvedRef.current = true
        onError()
      }
    }, timeoutMs)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMessage = (event: WebViewMessageEvent) => {
    if (resolvedRef.current) return
    try {
      const data = JSON.parse(event.nativeEvent.data)
      resolvedRef.current = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      onResult({
        title: data.title || '',
        description: data.description || '',
        imageUrl: data.imageUrl || undefined,
        faviconUrl: getFaviconUrl(url),
      })
    } catch {
      if (!resolvedRef.current) {
        resolvedRef.current = true
        onError()
      }
    }
  }

  const handleError = () => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    onError()
  }

  return (
    <View style={styles.hidden}>
      <WebView
        source={{ uri: url }}
        injectedJavaScriptBeforeContentLoaded={undefined}
        injectedJavaScript={INJECT_SCRIPT}
        onMessage={handleMessage}
        onError={handleError}
        onHttpError={handleError}
        javaScriptEnabled
        domStorageEnabled
        // Don't show any UI or allow interaction
        pointerEvents='none'
        focusable={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    overflow: 'hidden',
    position: 'absolute',
  },
})
