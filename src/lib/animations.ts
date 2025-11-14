import { Variants } from 'framer-motion';

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const slideIn: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const hoverScale = {
  scale: 1.02,
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

export const tapScale = {
  scale: 0.98,
};

export const cardHover = {
  y: -4,
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

export const buttonSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
};

export const shimmerAnimation = {
  x: ['-100%', '200%'],
};

export const shimmerTransition = {
  duration: 3,
  repeat: Infinity,
  repeatDelay: 2,
  ease: "easeInOut" as const,
};

export const resolveMotion = (variants: Variants, shouldReduceMotion: boolean) => {
  if (!shouldReduceMotion) return variants;
  
  const reduced: Variants = {};
  Object.keys(variants).forEach(key => {
    const variant = variants[key];
    if (typeof variant === 'object' && 'opacity' in variant) {
      reduced[key] = { opacity: variant.opacity };
    } else {
      reduced[key] = variant;
    }
  });
  return reduced;
};

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeInOut" },
};

export const modalTransition = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 },
};

export const listStagger = {
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};
