import React from "react"
import { clsx } from "clsx"

interface CardHeaderProps {
  className?: string
  cardTitleText?: string
  cardDescriptionText?: string
  cardDescriptionDivClassName?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  cardTitleText = "Card Title",
  cardDescriptionText = "Card description",
  cardDescriptionDivClassName,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-start gap-1.5 p-6 relative self-stretch w-full flex-[0_0_auto]",
        className
      )}
    >
      <div className="relative self-stretch mt-[-1.00px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[color:var(--shadcn-ui-card-foreground)] text-2xl tracking-[0] leading-6">
        {cardTitleText}
      </div>
      <div
        className={clsx(
          "relative self-stretch [font-family:'Inter-Regular',Helvetica] font-normal text-[color:var(--shadcn-ui-muted-foreground)] text-sm tracking-[0] leading-5",
          cardDescriptionDivClassName
        )}
      >
        {cardDescriptionText}
      </div>
    </div>
  )
}