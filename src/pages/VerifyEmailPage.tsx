import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // If user has verified email, redirect to home
    if (user?.email_confirmed_at) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setResending(true);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        console.error('Error resending verification email:', error);
        alert('Failed to resend verification email. Please try again.');
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);

    try {
      // Refresh the session to get the latest user data
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Error refreshing session:', error);
        alert('Failed to check verification status. Please try again.');
      } else if (data.user?.email_confirmed_at) {
        // Email is verified! The useEffect will handle redirect
        navigate('/', { replace: true });
      } else {
        alert('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin', { replace: true });
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <div className="bg-primary mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
            <Bookmark className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Verify Your Email</h1>
          <p className="text-secondary-foreground">Check your inbox to get started</p>
        </div>

        {/* Verification Info */}
        <div className="bg-card rounded-2xl p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Verification Email Sent</h2>
            <p className="text-secondary-foreground text-sm">We've sent a verification link to</p>
            <p className="mt-1 font-medium">{user?.email}</p>
          </div>

          <div className="bg-muted mb-6 rounded-lg p-4">
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              Next Steps
            </h3>
            <ol className="text-secondary-foreground space-y-2 text-sm">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the verification link in the email</li>
              <li>3. Return here and click "I've Verified My Email"</li>
            </ol>
          </div>

          {resendSuccess && (
            <div className="mb-4 rounded-lg border border-green-600 bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ Verification email resent successfully!
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              className="w-full"
              visualSize="lg"
              disabled={checking}
            >
              {checking && <RefreshCw className="h-5 w-5 animate-spin" />}
              {checking ? 'Checking...' : "I've Verified My Email"}
            </Button>

            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              visualSize="lg"
              disabled={resending || resendSuccess}
            >
              {resending
                ? 'Sending...'
                : resendSuccess
                  ? 'Email Sent!'
                  : 'Resend Verification Email'}
            </Button>

            <div className="pt-2 text-center">
              <button
                onClick={handleSignOut}
                className="text-secondary-foreground hover:text-foreground text-sm transition-colors"
              >
                Sign out and use a different account
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-secondary-foreground text-xs">
            Didn't receive the email? Check your spam folder or click resend above.
          </p>
        </div>
      </div>
    </div>
  );
}
