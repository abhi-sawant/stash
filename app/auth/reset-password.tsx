import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAppColorScheme } from '@/hooks/use-app-color-scheme'
import { api } from '../../lib/api'
import { getColors, radius, spacing, typography } from '../../lib/theme'

export default function ResetPasswordScreen() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const router = useRouter()
  const { email: emailParam } = useLocalSearchParams<{ email: string }>()

  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const otpRef = useRef<TextInput>(null)

  const email = emailParam ?? ''

  // Guard: if we arrive without an email, go back to forgot-password
  useEffect(() => {
    if (!email) router.replace('/auth/forgot-password')
  }, [email, router])

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleReset = async () => {
    setError(null)
    if (otp.trim().length !== 6) {
      setError('Please enter the full 6-digit reset code.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.auth.resetPassword(email, otp.trim(), password)
      // Success — go to login, replacing the reset stack so the user can't go back
      router.replace({ pathname: '/auth/login', params: { reset: '1' } })
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || cooldown > 0) return
    setResending(true)
    setError(null)
    try {
      await api.auth.forgotPassword(email)
      setCooldown(60)
      setOtp('')
      otpRef.current?.focus()
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name='lock-open-outline' size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the code we sent to{'\n'}
              <Text style={{ color: colors.text, fontWeight: '600' }}>{email}</Text>
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* OTP code */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Reset Code</Text>
              <TextInput
                ref={otpRef}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: otp.length > 0 ? colors.inputFocusBorder : colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={otp}
                onChangeText={(t) => {
                  setOtp(t.replace(/\D/g, '').slice(0, 6))
                  setError(null)
                }}
                keyboardType='number-pad'
                maxLength={6}
                autoFocus
                textContentType='oneTimeCode'
                returnKeyType='next'
                placeholder='000000'
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* New password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name='lock-closed-outline' size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder='At least 8 characters'
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType='newPassword'
                  returnKeyType='next'
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} activeOpacity={0.7}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textTertiary}
                    style={styles.inputIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons name='lock-closed-outline' size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder='Re-enter your password'
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  textContentType='newPassword'
                  returnKeyType='done'
                  onSubmitEditing={handleReset}
                />
              </View>
            </View>

            {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
          </View>

          {/* Reset button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.75}>
            {loading ? <ActivityIndicator color='#fff' /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
          </TouchableOpacity>

          {/* Resend code */}
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
        </ScrollView>
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
  scroll: {
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
  title: {
    ...typography.headlineLarge,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fieldGroup: { gap: spacing.xs },
  label: { ...typography.labelMedium },
  otpInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    height: 56,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    padding: 0,
  },
  errorText: {
    ...typography.bodySmall,
    marginTop: -spacing.sm,
  },
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
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: { ...typography.bodyMedium },
  footerLink: { ...typography.titleSmall },
})
