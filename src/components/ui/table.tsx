import * as React from "react";

import { cn } from "@/lib/utils";

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("min-w-full border-separate border-spacing-y-2", className)}
        {...props}
      />
    </div>
  );
}
