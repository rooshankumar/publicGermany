import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
  animated?: boolean;
}

export const ProgressBar = ({ 
  progress, 
  label, 
  showPercentage = true,
  className = '',
  animated = true
}: ProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`glass-panel p-4 border-border/30 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="font-medium text-sm">{label}</span>}
          {showPercentage && (
            <span className="text-primary font-bold text-sm">{clampedProgress}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
        {animated ? (
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary-glow to-success rounded-full shadow-glow"
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ) : (
          <div
            className="h-full bg-gradient-to-r from-primary via-primary-glow to-success rounded-full shadow-glow transition-all duration-500"
            style={{ width: `${clampedProgress}%` }}
          />
        )}
      </div>
    </div>
  );
};

// Circular progress variant
export const CircularProgress = ({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  label
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  label?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
          opacity="0.3"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
        {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
      </div>
    </div>
  );
};
