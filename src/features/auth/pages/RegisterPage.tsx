import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(80, 'Username too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  university: z.string().optional(),
  faculty: z.string().optional(),
  pin: z.string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must contain only numbers'),
  confirmPin: z.string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must contain only numbers'),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ['confirmPin'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPin, ...registrationData } = data;
      const response = await authAPI.register(registrationData);
      const { user, access_token, refresh_token } = response.data;
      
      setAuth(user, access_token, refresh_token);
      toast({
        title: 'Account created',
        description: 'Welcome to UniPay!',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: 'Social Login',
      description: `${provider} registration integration coming soon!`,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-surface-1 to-surface-2 p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center">
              <img 
                src="/assets/logo.png" 
                alt="UniPay Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              UniPay
            </span>
          </div>
        </div>
        
        <Card className="border-border/50 shadow-soft-lg">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-foreground">Create Account</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Join UniPay - Your smart student wallet
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-foreground font-medium">First Name *</Label>
                  <Input
                    id="first_name"
                    autoComplete="given-name"
                    {...register('first_name')}
                    className="h-11"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-danger-hover">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-foreground font-medium">Last Name *</Label>
                  <Input
                    id="last_name"
                    autoComplete="family-name"
                    {...register('last_name')}
                    className="h-11"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-danger-hover">{errors.last_name.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  autoComplete="email"
                  {...register('email')}
                  className="h-11"
                />
                {errors.email && (
                  <p className="text-sm text-danger-hover">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">Username *</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  {...register('username')}
                  className="h-11"
                />
                {errors.username && (
                  <p className="text-sm text-danger-hover">{errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="h-11"
                />
                {errors.password && (
                  <p className="text-sm text-danger-hover">{errors.password.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-foreground font-medium">PIN (4 digits) *</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="1234"
                    maxLength={4}
                    autoComplete="off"
                    {...register('pin')}
                    className="h-11"
                  />
                  {errors.pin && (
                    <p className="text-sm text-danger-hover">{errors.pin.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPin" className="text-foreground font-medium">Confirm PIN *</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    placeholder="1234"
                    maxLength={4}
                    autoComplete="off"
                    {...register('confirmPin')}
                    className="h-11"
                  />
                  {errors.confirmPin && (
                    <p className="text-sm text-danger-hover">{errors.confirmPin.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="university" className="text-foreground font-medium">University</Label>
                <Input
                  id="university"
                  {...register('university')}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faculty" className="text-foreground font-medium">Faculty</Label>
                <Input
                  id="faculty"
                  {...register('faculty')}
                  className="h-11"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" className="w-full h-12 shadow-soft" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('Google')}
                  className="h-11"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('Facebook')}
                  className="h-11"
                >
                  <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
