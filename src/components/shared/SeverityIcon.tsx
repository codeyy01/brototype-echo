import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface SeverityIconProps {
  severity: 'low' | 'medium' | 'critical';
}

export const SeverityIcon = ({ severity }: SeverityIconProps) => {
  const severityConfig = {
    low: {
      icon: Info,
      className: 'text-blue-500',
    },
    medium: {
      icon: AlertCircle,
      className: 'text-yellow-500',
    },
    critical: {
      icon: AlertTriangle,
      className: 'text-red-500',
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return <Icon className={`h-5 w-5 ${config.className}`} />;
};