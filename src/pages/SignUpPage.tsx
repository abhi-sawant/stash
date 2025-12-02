import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Bookmark, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        // Provide more helpful error messages
        let errorMessage = error.message;

        if (error.message.includes('500')) {
          errorMessage = 'Server error. Please check Supabase configuration or try again later.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'This email is already registered. Try signing in instead.';
        } else if (error.message.includes('Email')) {
          errorMessage = 'Invalid email address. Please check and try again.';
        }

        setError(errorMessage);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
      console.error('Signup error:', err);
    }
  };

  if (success) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl p-8 shadow-lg">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Check Your Email!</h2>
            <p className="text-secondary-foreground mb-4">
              We've sent a verification link to <strong>{email}</strong>. Please verify your email
              to access your account.
            </p>
            <p className="text-secondary-foreground text-sm">
              Redirecting you to verification page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <div className="bg-primary mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
            <Bookmark className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Create Account</h1>
          <p className="text-secondary-foreground">Start organizing your bookmarks today</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-card rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="border-destructive bg-destructive rounded-lg border">
                <p className="text-destructive-foreground text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                visualSize="lg"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                visualSize="lg"
                required
                disabled={loading}
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                visualSize="lg"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {/* Submit Button */}
            <Button visualSize="lg" type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-secondary-foreground text-sm">
              Already have an account?{' '}
              <Link to="/signin" className="text-primary font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
