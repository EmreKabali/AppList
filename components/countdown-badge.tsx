import { Badge } from "./ui/badge";

interface CountdownBadgeProps {
  endDate: string;
}

function calculateDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function CountdownBadge({ endDate }: CountdownBadgeProps) {
  const daysRemaining = calculateDaysRemaining(endDate);

  if (daysRemaining < 0) {
    return <Badge variant="default">Sona Erdi</Badge>;
  }

  if (daysRemaining <= 4) {
    return <Badge variant="danger">{daysRemaining} gun</Badge>;
  }

  if (daysRemaining <= 9) {
    return <Badge variant="warning">{daysRemaining} gun</Badge>;
  }

  return <Badge variant="success">{daysRemaining} gun</Badge>;
}
