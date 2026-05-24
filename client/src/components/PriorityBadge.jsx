// ── FILE: components/PriorityBadge.jsx ── Visual priority tier indicator
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

/**
 * Large priority badge for kiosk display.
 * RED = pulsing urgent, YELLOW = moderate, GREEN = routine.
 *
 * @param {'RED'|'YELLOW'|'GREEN'} tier - Priority level
 * @param {'sm'|'md'|'lg'} size - Badge size variant
 */
export default function PriorityBadge({ tier, size = 'md' }) {
  const config = {
    RED: {
      bg: 'bg-kiosk-red',
      text: 'text-white',
      label: 'URGENT',
      sublabel: 'You will be seen shortly',
      icon: <AlertTriangle />,
      pulse: true,
      glow: 'kiosk-glow-red',
    },
    YELLOW: {
      bg: 'bg-kiosk-amber',
      text: 'text-white',
      label: 'MODERATE',
      sublabel: 'Please wait nearby',
      icon: <Clock />,
      pulse: false,
      glow: '',
    },
    GREEN: {
      bg: 'bg-kiosk-green',
      text: 'text-white',
      label: 'ROUTINE',
      sublabel: 'Please take a seat',
      icon: <CheckCircle />,
      pulse: false,
      glow: 'kiosk-glow-green',
    },
  };

  const c = config[tier] || config.GREEN;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-lg gap-3',
    lg: 'px-8 py-5 text-2xl gap-4',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.4 }}
      className={`
        inline-flex items-center rounded-full font-heading font-bold
        ${c.bg} ${c.text} ${sizeClasses[size]} ${c.glow}
        ${c.pulse ? 'priority-pulse' : ''}
      `}
    >
      <span className={iconSize[size]}>{c.icon}</span>
      <span>{c.label}</span>
    </motion.div>
  );
}
