import * as Headless from '@headlessui/react'
import clsx from 'clsx'

interface SimpleRadioGroupProps {
  value?: string
  onChange: (value: string) => void
  options: string[]
  className?: string
}

export function SimpleRadioGroup({ value, onChange, options, className }: SimpleRadioGroupProps) {
  // Ensure value is never undefined to prevent controlled/uncontrolled warning
  const controlledValue = value ?? ''
  
  return (
    <Headless.RadioGroup value={controlledValue} onChange={onChange} className={clsx('flex items-center gap-10', className)}>
      {options.map((option) => (
        <Headless.Radio key={option} value={option} className="group cursor-pointer">
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-normal text-zinc-700">{option}</span>
            <div className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-300 bg-white transition-all group-hover:border-zinc-400 group-data-[checked]:border-zinc-900 group-data-[checked]:bg-zinc-900">
              <div className="h-2 w-2 rounded-full bg-white opacity-0 transition-opacity group-data-[checked]:opacity-100" />
            </div>
          </div>
        </Headless.Radio>
      ))}
    </Headless.RadioGroup>
  )
}