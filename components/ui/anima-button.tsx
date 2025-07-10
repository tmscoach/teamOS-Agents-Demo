import React from "react"
import { Button as ShadcnButton } from "./button"
import { clsx } from "clsx"

interface AnimaButtonProps {
  size?: "sm" | "md" | "lg"
  state?: "default" | "hover" | "active" | "default_1"
  text?: string
  text1?: string
  type?: "default" | "ghost" | "destructive"
  className?: string
  children?: React.ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
}

export const Button: React.FC<AnimaButtonProps> = ({
  size = "sm",
  state = "default",
  text,
  text1,
  type = "default",
  className,
  children,
  ...props
}) => {
  const animaClasses = clsx(
    // Base classes from Anima
    "inline-flex items-center justify-center gap-2 px-3 py-2 relative",
    {
      // Size variations
      "h-8 text-sm": size === "sm",
      "h-9 text-sm": size === "md", 
      "h-10 text-base": size === "lg",
      // Type variations
      "bg-[color:var(--shadcn-ui-primary)] text-[color:var(--shadcn-ui-primary-foreground)]": type === "default",
      "bg-transparent hover:bg-[color:var(--shadcn-ui-accent)] hover:text-[color:var(--shadcn-ui-accent-foreground)]": type === "ghost",
      "bg-[color:var(--shadcn-ui-destructive)] text-[color:var(--shadcn-ui-destructive-foreground)]": type === "destructive",
    },
    className
  )

  return (
    <ShadcnButton 
      className={animaClasses}
      variant={type === "ghost" ? "ghost" : type === "destructive" ? "destructive" : "default"}
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      {...props}
    >
      {text || text1 || children}
    </ShadcnButton>
  )
}