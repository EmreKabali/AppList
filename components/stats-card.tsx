import Link from "next/link";
import { Card } from "./ui/card";

interface StatsCardProps {
  value: number | string;
  label: string;
  className?: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

export function StatsCard({
  value,
  label,
  className = "",
  href,
  active = false,
  onClick,
}: StatsCardProps) {
  const content = (
    <Card
      className={`text-center transition-all duration-200 ${
        active
          ? "ring-2 ring-[var(--primary)] border-[var(--primary)]"
          : "hover:-translate-y-0.5 hover:border-indigo-300"
      } ${className}`}
    >
      <div className="text-3xl font-bold text-indigo-600 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </Card>
  );

  if (!href) {
    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className="block w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-xl"
        >
          {content}
        </button>
      );
    }

    return content;
  }

  return (
    <Link
      href={href}
      prefetch
      className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-xl"
    >
      {content}
    </Link>
  );
}
