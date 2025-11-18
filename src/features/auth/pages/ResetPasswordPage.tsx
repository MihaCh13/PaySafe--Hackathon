import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenError(true);
      toast({
        title: 'Invalid Reset Link',
        description: 'The password reset link is invalid or missing.',
        variant: 'destructive',
      });
    }
  }, [token, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      return;
    }

    try {
      await authAPI.resetPassword(token, data.password);
      setIsSuccess(true);
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now login with your new password.',
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      toast({
        title: 'Password Reset Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
        setTokenError(true);
      }
    }
  };

  if (tokenError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-surface-1 to-surface-2 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center">
                <img 
                  src="/assets/logo.png" 
                  alt="UniPay Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-3xl font-extrabold bg-gradient-to-r from-[#9b87f5] via-[#7DD3FC] to-[#60C5E8] bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                UniPay
              </span>
            </div>
          </div>
          
          <Card className="border-border/50 shadow-soft-lg">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-danger/10 p-3">
                  <XCircle className="h-12 w-12 text-danger" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center text-foreground">Invalid Reset Link</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full h-12 shadow-soft"
              >
                Back to Login
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Need help?{' '}
                <a href="mailto:support@unipay.com" className="text-primary hover:text-primary-hover font-medium transition-colors">
                  Contact Support
                </a>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-surface-1 to-surface-2 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center">
                <img 
                  src="/assets/logo.png" 
                  alt="UniPay Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-3xl font-extrabold bg-gradient-to-r from-[#9b87f5] via-[#7DD3FC] to-[#60C5E8] bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                UniPay
              </span>
            </div>
          </div>
          
          <Card className="border-border/50 shadow-soft-lg">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center text-foreground">Password Reset Successful!</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Your password has been changed successfully. Redirecting you to login...
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full h-12 shadow-soft"
              >
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-surface-1 to-surface-2 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center">
              <img 
                src="/assets/logo.png" 
                alt="UniPay Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-3xl font-extrabold bg-gradient-to-r from-[#9b87f5] via-[#7DD3FC] to-[#60C5E8] bg-clip-text text-transparent tracking-tight drop-shadow-sm">
              UniPay
            </span>
          </div>
        </div>
        
        <Card className="border-border/50 shadow-soft-lg">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-foreground">Set New Password</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Create a strong password for your UniPay account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your new password"
                    {...register('password')}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-danger-hover">{errors.password.message}</p>
                )}
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>At least 8 characters</li>
                    <li>One uppercase and one lowercase letter</li>
                    <li>At least one number</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    {...register('confirmPassword')}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-danger-hover">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" className="w-full h-12 shadow-soft" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Remember your password?{' '}
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                  Back to Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
