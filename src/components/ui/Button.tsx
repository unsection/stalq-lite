import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = ({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#0080FF] text-white hover:bg-[#0066cc]",
        variant === "secondary" &&
          "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900",
        variant === "ghost" && "text-zinc-400 hover:bg-zinc-900 hover:text-white",
        className,
      )}
      {...props}
    />
  );
};
