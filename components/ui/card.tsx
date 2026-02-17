import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "article" | "section";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", as: Component = "div", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] p-5 transition-all duration-200 hover:shadow-md ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--card-foreground)] ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
