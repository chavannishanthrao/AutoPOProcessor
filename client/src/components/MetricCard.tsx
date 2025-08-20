import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconBgColor,
  iconColor,
}: MetricCardProps) {
  return (
    <Card className="border border-gray-100" data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`${iconColor} text-xl`} />
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold text-gray-900" data-testid={`metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-green-600 font-medium">{subtitle}</span>
          {trend && <span className="text-gray-400 ml-2">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
