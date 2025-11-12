import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Bell, Lock, Globe, Palette, Shield, CreditCard } from 'lucide-react';

const MotionCard = motion.create(Card);

export default function SettingsPage() {
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

  const settingsSections = [
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage your notification preferences',
      bgColor: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      icon: Lock,
      title: 'Security',
      description: 'Password, PIN, and two-factor authentication',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Globe,
      title: 'Language & Region',
      description: 'Language, currency, and timezone settings',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the look and feel',
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
    {
      icon: Shield,
      title: 'Privacy',
      description: 'Control your data and privacy settings',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      icon: CreditCard,
      title: 'Payment Methods',
      description: 'Manage your linked payment methods',
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-4xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </motion.div>

      <div className="grid gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <MotionCard
              key={section.title}
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              className="border-0 shadow-sm cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${section.bgColor} rounded-lg`}>
                      <Icon className={`h-6 w-6 ${section.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </MotionCard>
          );
        })}
      </div>
    </motion.div>
  );
}
