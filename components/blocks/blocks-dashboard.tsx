import React from "react"
import Image from "next/image"

interface BlocksDashboardProps {
  TMSLogoDivClassName?: string
  TMSLogoDivClassNameOverride?: string
  TMSLogoEllipseClassName?: string
  TMSLogoEllipseClassName1?: string
  TMSLogoEllipseClassName2?: string
  TMSLogoEllipseClassName3?: string
  TMSLogoEllipseClassNameOverride?: string
  TMSLogoImg?: string
  TMSLogoSubtract?: string
  className?: string
  divClassName?: string
}

export const BlocksDashboard: React.FC<BlocksDashboardProps> = ({
  TMSLogoDivClassName,
  TMSLogoDivClassNameOverride,
  TMSLogoEllipseClassName,
  TMSLogoEllipseClassName1,
  TMSLogoEllipseClassName2,
  TMSLogoEllipseClassName3,
  TMSLogoEllipseClassNameOverride,
  TMSLogoImg,
  TMSLogoSubtract,
  className,
  divClassName,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className || ""}`}>
      <Image
        src="/icons/teamos-logo.png"
        alt="TeamOS Logo"
        width={80}
        height={30}
        className="object-contain"
      />
    </div>
  )
}