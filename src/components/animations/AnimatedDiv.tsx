import { motion, Variants, useReducedMotion } from 'framer-motion';
import { resolveMotion } from '@/lib/animations';

interface AnimatedDivProps {
  children: React.ReactNode;
  variants?: Variants;
  custom?: number;
  className?: string;
  [key: string]: any;
}

export function AnimatedDiv({ children, variants, custom, className, ...props }: AnimatedDivProps) {
  const shouldReduceMotion = useReducedMotion() || false;
  const resolvedVariants = variants ? resolveMotion(variants, shouldReduceMotion) : undefined;

  return (
    <motion.div
      variants={resolvedVariants}
      custom={custom}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
