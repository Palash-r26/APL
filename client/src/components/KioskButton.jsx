// ── FILE: components/KioskButton.jsx ── Reusable large touch-friendly button
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Large kiosk button designed for touch-screen interaction.
 * @param {string} label - Button text
 * @param {ReactNode} icon - Optional icon element
 * @param {Function} onClick - Click handler
 * @param {'primary'|'secondary'|'danger'|'success'} variant - Visual style
 * @param {boolean} disabled - Disable button
 * @param {boolean} loading - Show loading spinner
 * @param {string} className - Additional classes
 */
export default function KioskButton({
  label,
  icon,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}) {
  // Variant styles
  const variants = {
    primary:
      'bg-gradient-to-r from-kiosk-blue to-blue-600 text-white hover:from-kiosk-blue-dark hover:to-blue-700 kiosk-glow-blue',
    secondary:
      'bg-white text-kiosk-blue border-2 border-kiosk-blue/20 hover:bg-kiosk-blue-light hover:border-kiosk-blue/40',
    danger:
      'bg-gradient-to-r from-kiosk-red to-red-600 text-white hover:from-red-700 hover:to-red-800 kiosk-glow-red',
    success:
      'bg-gradient-to-r from-kiosk-green to-green-600 text-white hover:from-green-700 hover:to-green-700 kiosk-glow-green',
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.015 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.985 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative w-full min-h-[80px] px-8 py-5
        rounded-2xl font-heading font-bold text-xl
        flex items-center justify-center gap-3
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant] || variants.primary}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-7 h-7 animate-spin" />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{label}</span>
        </>
      )}
    </motion.button>
  );
}
