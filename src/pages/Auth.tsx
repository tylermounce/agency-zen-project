
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showSetNewPassword, setShowSetNewPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Check for password reset flow
  useEffect(() => {
    const isReset = searchParams.get('reset') === 'true';
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');

    if (isReset) {
      if (errorCode) {
        // There was an error with the reset link
        setError(errorDescription?.replace(/\+/g, ' ') || 'Password reset link is invalid or expired. Please request a new one.');
      } else {
        // Check if we have a valid session from the reset link
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            // User clicked valid reset link and has a session
            setShowSetNewPassword(true);
          }
        });
      }
    }
  }, [searchParams]);

  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
      console.error('Password update error:', error);
    } else {
      setPasswordUpdateSuccess(true);
      toast({
        title: "Password updated!",
        description: "Your password has been changed successfully.",
      });
      // Sign out and redirect to login
      await supabase.auth.signOut();
    }

    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      console.error('Sign in error:', error);
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(error.message);
      console.error('Sign up error:', error);
    } else {
      setSignUpSuccess(true);
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account before signing in.",
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      console.error('Password reset error:', error);
    } else {
      setResetEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link.",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agency Ops</h1>
          <p className="text-gray-600 mt-2">Manage your projects and tasks efficiently</p>
        </div>

        {passwordUpdateSuccess ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Password Updated!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p>Your password has been successfully updated.</p>
                <p className="text-sm text-gray-600">
                  You can now sign in with your new password.
                </p>
                <Button
                  onClick={() => {
                    setPasswordUpdateSuccess(false);
                    setShowSetNewPassword(false);
                    // Clear the URL params
                    window.history.replaceState({}, '', '/auth');
                  }}
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : showSetNewPassword ? (
          <Card>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : signUpSuccess ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Check Your Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p>We've sent you a verification email. Please click the link in the email to verify your account.</p>
                <p className="text-sm text-gray-600">
                  After verification, you can return here to sign in.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSignUpSuccess(false)}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : resetEmailSent ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Check Your Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p>We've sent you a password reset link. Please check your email and click the link to reset your password.</p>
                <p className="text-sm text-gray-600">
                  The link will expire in 24 hours.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResetEmailSent(false);
                    setShowForgotPassword(false);
                  }}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : showForgotPassword ? (
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError(null);
                  }}
                >
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm text-gray-600"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError(null);
                      }}
                    >
                      Forgot your password?
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Sign up for a new account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        name="fullName"
                        type="text"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        minLength={6}
                        required
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Auth;
