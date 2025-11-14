import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';
import { staggerContainer, fadeUp, resolveMotion } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
}

export function AnimatedSection({ 
  children, 
  className, 
  delay = 0,
  stagger = false,
}: AnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const variants = stagger ? staggerContainer : fadeUp;
  const finalVariants = resolveMotion(variants, shouldReduceMotion || false);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={finalVariants}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
