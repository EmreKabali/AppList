import { Card } from "./ui/card";

interface StatsCardProps {
  value: number | string;
  label: string;
  className?: string;
}

export function StatsCard({ value, label, className = "" }: StatsCardProps) {
  return (
    <Card className={`text-center ${className}`}>
      <div className="text-3xl font-bold text-indigo-600 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </Card>
  );
}
