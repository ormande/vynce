import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionButtonProps = {
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
};

export function ActionButton({
  href,
  onClick,
  icon: Icon,
  children,
  className,
  variant = "primary",
}: ActionButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition shadow-[0_14px_30px_rgba(35,70,58,0.18)] cursor-pointer",
    variant === "primary" && "bg-accent !text-accent-foreground hover:bg-[var(--accent-strong)]",
    variant === "secondary" && "border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)] hover:bg-[var(--panel-strong)]",
    className
  );

  const iconStyles = cn(
    "h-4 w-4 shrink-0",
    variant === "primary" && "!text-accent-foreground",
    variant === "secondary" && "text-[var(--accent)]"
  );

  const content = (
    <>
      {Icon && <Icon className={iconStyles} />}
      <span className={cn(variant === "primary" && "!text-accent-foreground")}>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseStyles}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseStyles}>
      {content}
    </button>
  );
}
