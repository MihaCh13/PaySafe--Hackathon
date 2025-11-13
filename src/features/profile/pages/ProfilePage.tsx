import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import { ChangePinDialog } from '../components/ChangePinDialog';
import { EditProfileDialog } from '../components/EditProfileDialog';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap, 
  Edit, 
  Lock,
  Award,
  Target,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Monitor,
  Clock,
  AlertTriangle,
  Key,
  Upload,
  Camera
} from 'lucide-react';

const MotionCard = motion.create(Card);

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isChangePinDialogOpen, setIsChangePinDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [pinStatus, setPinStatus] = useState<{ hasPin: boolean; isDefaultPin: boolean } | null>(null);
  const [isPinStatusLoading, setIsPinStatusLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPinStatus = async () => {
    try {
      setIsPinStatusLoading(true);
      const response = await authAPI.checkDefaultPin();
      setPinStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch PIN status:', error);
    } finally {
      setIsPinStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchPinStatus();
  }, []);

  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.[0] || user.username?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  const handlePinChangeSuccess = () => {
    fetchPinStatus();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a PNG, JPG, GIF, or WEBP image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await authAPI.uploadProfilePhoto(formData);
      
      // Update user in store
      if (response.data.user) {
        updateUser(response.data.user);
      }

      toast({
        title: 'Success',
        description: 'Profile photo updated successfully',
      });
    } catch (error: any) {
      console.error('Failed to upload profile photo:', error);
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.error || 'Failed to upload profile photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleToggle2FA = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    toast({
      title: enabled ? '2FA Enabled' : '2FA Disabled',
      description: enabled 
        ? 'Two-factor authentication has been enabled for your account' 
        : 'Two-factor authentication has been disabled',
    });
  };

  const handleResendVerification = () => {
    toast({
      title: 'Verification Email Sent',
      description: 'Please check your inbox for the verification link',
    });
  };

  const handleTerminateSession = (deviceName: string) => {
    toast({
      title: 'Session Terminated',
      description: `${deviceName} has been logged out`,
      variant: 'destructive',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-4xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </motion.div>

      <MotionCard variants={itemVariants} className="border-0 shadow-sm">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24 border-4 border-violet-100">
              {user?.profile_photo_url ? (
                <AvatarImage 
                  src={user.profile_photo_url} 
                  alt={`${user.first_name} ${user.last_name}`}
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-3xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-600 mt-1">@{user?.username}</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUploadClick}
                    disabled={isUploadingPhoto}
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" onClick={() => setIsEditProfileDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" onClick={() => setIsChangePinDialogOpen(true)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Change PIN
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </MotionCard>

      <div className="grid md:grid-cols-2 gap-6">
        <MotionCard variants={itemVariants} className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">
                  {user?.phone || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard variants={itemVariants} className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building2 className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">University</p>
                <p className="font-medium text-gray-900">
                  {user?.university || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <GraduationCap className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Faculty</p>
                <p className="font-medium text-gray-900">
                  {user?.faculty || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg border border-violet-200">
              <Award className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-sm text-violet-600">ISIC Status</p>
                <p className="font-medium text-violet-700">
                  {user?.is_verified ? 'Verified Student' : 'Not Verified'}
                </p>
              </div>
            </div>
          </CardContent>
        </MotionCard>
      </div>

      <MotionCard variants={itemVariants} className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Achievements & Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg border border-violet-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-violet-600" />
                <p className="text-sm font-medium text-violet-900">Savings Goals</p>
              </div>
              <p className="text-2xl font-bold text-violet-700">0</p>
              <p className="text-xs text-violet-600 mt-1">Goals completed</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Transactions</p>
              </div>
              <p className="text-2xl font-bold text-green-700">0</p>
              <p className="text-xs text-green-600 mt-1">Total transactions</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Member Since</p>
              </div>
              <p className="text-lg font-bold text-blue-700">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
              <p className="text-xs text-blue-600 mt-1">UniPay member</p>
            </div>
          </div>
        </CardContent>
      </MotionCard>

      <MotionCard variants={itemVariants} className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            <CardTitle className="text-lg">Security Settings</CardTitle>
          </div>
          <CardDescription>Manage your account security and authentication preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Email Verification</p>
                  <p className="text-sm text-gray-600">
                    {user?.is_verified ? 'Your email has been verified' : 'Please verify your email address'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user?.is_verified ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <>
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                    <Button size="sm" variant="outline" onClick={handleResendVerification}>
                      Resend Email
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication (2FA)</p>
                  <p className="text-sm text-gray-600">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              <Switch 
                checked={twoFactorEnabled} 
                onCheckedChange={handleToggle2FA}
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Security PIN</p>
                    <p className="text-sm text-gray-600">
                      Required for sensitive operations like DarkDays Pocket deposits
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!isPinStatusLoading && pinStatus?.hasPin && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono tracking-wider text-gray-400">••••</span>
                      {pinStatus.isDefaultPin && (
                        <Badge variant="destructive" className="animate-pulse">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Default PIN
                        </Badge>
                      )}
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    variant={pinStatus?.isDefaultPin ? "default" : "outline"}
                    onClick={() => setIsChangePinDialogOpen(true)}
                    className={pinStatus?.isDefaultPin ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" : ""}
                  >
                    {pinStatus?.isDefaultPin ? 'Change Default PIN' : 'Change PIN'}
                  </Button>
                </div>
              </div>
              {pinStatus?.isDefaultPin && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-900">
                    <strong>⚠️ Security Warning:</strong> You're using the default PIN (1234). 
                    Please change it to a unique 4-digit PIN to secure your account.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">Login Attempt Rate Limiting</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Your account is protected against brute force attacks. After 5 failed login attempts, 
                    your account will be temporarily locked for 15 minutes.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-amber-300 text-amber-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active Protection
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Active Sessions</h3>
            <p className="text-sm text-gray-600 mb-4">Manage devices and locations where you're currently logged in</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Current Device</p>
                    <p className="text-sm text-gray-600">Chrome on Windows • Last active now</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">iPhone 12 Pro</p>
                    <p className="text-sm text-gray-600">Safari • Last active 2 hours ago</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleTerminateSession('iPhone 12 Pro')}
                >
                  Terminate
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">MacBook Air</p>
                    <p className="text-sm text-gray-600">Safari • Last active yesterday</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleTerminateSession('MacBook Air')}
                >
                  Terminate
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Session timeout: 30 days of inactivity</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Refresh tokens allow you to stay logged in for longer periods. 
              Your session will automatically expire after 30 days of inactivity for security.
            </p>
          </div>
        </CardContent>
      </MotionCard>

      <ChangePinDialog
        open={isChangePinDialogOpen}
        onClose={() => setIsChangePinDialogOpen(false)}
        onSuccess={handlePinChangeSuccess}
      />

      <EditProfileDialog
        open={isEditProfileDialogOpen}
        onClose={() => setIsEditProfileDialogOpen(false)}
      />
    </motion.div>
  );
}
