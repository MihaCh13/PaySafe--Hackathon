import { motion, Variants, useReducedMotion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { resolveMotion, hoverScale, tapScale } from '@/lib/animations';
import { forwardRef, ComponentProps } from 'react';

interface MotionCardProps {
  children: React.ReactNode;
  variants?: Variants;
  custom?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  [key: string]: any;
}

const BaseMotionCard = motion.create(Card);

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ children, variants, custom, className, style, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion() || false;
    const resolvedVariants = variants ? resolveMotion(variants, shouldReduceMotion) : undefined;
    
    const whileHover = shouldReduceMotion ? undefined : hoverScale;
    const whileTap = shouldReduceMotion ? undefined : tapScale;

    return (
      <BaseMotionCard
        ref={ref}
        variants={resolvedVariants}
        custom={custom}
        className={className}
        style={style}
        whileHover={whileHover}
        whileTap={whileTap}
        {...props}
      >
        {children}
      </BaseMotionCard>
    );
  }
);

MotionCard.displayName = 'MotionCard';

type AnimatedCardProps = ComponentProps<typeof Card> & {
  hover?: boolean;
  tap?: boolean;
  animate?: boolean;
  delay?: number;
};

export function AnimatedCard({ 
  children, 
  hover = true,
  tap = true,
  animate = true,
  delay = 0,
  className,
  ...props 
}: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion() || false;

  const initial = animate && !shouldReduceMotion ? { opacity: 0, y: 20 } : { opacity: 0 };
  const animateProps = animate ? { opacity: 1, y: shouldReduceMotion ? undefined : 0 } : undefined;
  const whileHover = hover && !shouldReduceMotion ? { scale: 1.02 } : undefined;
  const whileTap = tap && !shouldReduceMotion ? { scale: 0.98 } : undefined;

  return (
    <motion.div
      initial={initial}
      animate={animateProps}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ 
        delay,
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}
