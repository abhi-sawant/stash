import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import { useAuth } from '../../lib/auth-context'
import { useBookmarks } from '../../lib/context'
import { fetchLatestBackup } from '../../lib/sync'
import { getColors, radius, spacing, typography } from '../../lib/theme'

export default function OtpScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const router = useRouter()
  const { pendingEmail, verifyOtp, resendOtp } = useAuth()
  const { restore } = useBookmarks()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0) // seconds until resend is allowed
  const inputRef = useRef<TextInput>(null)

  // If we somehow end up on this screen without a pending email, go back
  useEffect(() => {
    if (!pendingEmail) router.back()
  }, [pendingEmail, router])

  // Countdown timer for the resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleVerify = async () => {
    if (!pendingEmail) return
    setError(null)
    if (otp.trim().length !== 6) {
      setError('Please enter the full 6-digit code.')
      return
    }
    setLoading(true)
    try {
      await verifyOtp(pendingEmail, otp.trim())
      // ── Check for a remote backup and offer to restore ──────────────────
      try {
        const backup = await fetchLatestBackup()
        if (backup?.data) {
          Alert.alert(
            'Backup Found',
            `A backup from ${new Date(backup.created_at).toLocaleDateString()} was found on the server. Would you like to restore it?`,
            [
              { text: 'Skip', style: 'cancel', onPress: () => router.replace('/(tabs)') },
              {
                text: 'Restore',
                onPress: () => {
                  restore({
                    bookmarks: backup.data.bookmarks ?? [],
                    collections: backup.data.collections ?? [],
                    settings: backup.data.settings ?? {},
                  })
                  router.replace('/(tabs)')
                },
              },
            ],
          )
        } else {
          router.replace('/(tabs)')
        }
      } catch {
        // Backup check failed — still navigate to app
        router.replace('/(tabs)')
      }
    } catch (e: any) {
      setError(e.message ?? 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail || cooldown > 0) return
    setResending(true)
    setError(null)
    try {
      await resendOtp(pendingEmail)
      setCooldown(60) // 60-second cooldown between resends
      setOtp('')
      inputRef.current?.focus()
    } catch (e: any) {
      setError(e.message ?? 'Could not resend the code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <Ionicons name='arrow-back' size={24} color={colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name='mail-open-outline' size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: colors.text, fontWeight: '600' }}>{pendingEmail}</Text>
            </Text>
          </View>

          {/* OTP input */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Verification Code</Text>
            <TextInput
              ref={inputRef}
              style={[
                styles.otpInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: otp.length > 0 ? colors.inputFocusBorder : colors.inputBorder,
                  color: colors.text,
                  letterSpacing: 12,
                },
              ]}
              value={otp}
              onChangeText={(text) => {
                setOtp(text.replace(/\D/g, '').slice(0, 6))
                setError(null)
              }}
              keyboardType='number-pad'
              maxLength={6}
              autoFocus
              textContentType='oneTimeCode'
              returnKeyType='done'
              onSubmitEditing={handleVerify}
              placeholder='000000'
              placeholderTextColor={colors.textTertiary}
            />
            {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.75}>
            {loading ? <ActivityIndicator color='#fff' /> : <Text style={styles.primaryBtnText}>Verify</Text>}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{"Didn't receive the code?"}</Text>
            <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || resending} activeOpacity={0.75}>
              {resending ? (
                <ActivityIndicator size='small' color={colors.primary} style={{ marginLeft: spacing.sm }} />
              ) : (
                <Text style={[styles.footerLink, { color: cooldown > 0 ? colors.textTertiary : colors.primary }]}>
                  {cooldown > 0 ? ` Resend in ${cooldown}s` : ' Resend'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  backBtn: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.headlineLarge, textAlign: 'center' },
  subtitle: { ...typography.bodyMedium, textAlign: 'center', lineHeight: 22 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: { ...typography.labelMedium },
  otpInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    height: 60,
    paddingHorizontal: spacing.lg,
    ...typography.headlineMedium,
    textAlign: 'center',
  },
  errorText: { ...typography.bodySmall },
  primaryBtn: {
    borderRadius: radius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    ...typography.titleMedium,
    color: '#fff',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: { ...typography.bodyMedium },
  footerLink: { ...typography.titleSmall },
})
