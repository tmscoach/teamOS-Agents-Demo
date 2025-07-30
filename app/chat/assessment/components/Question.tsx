import { SimpleRadioGroup } from './simple-radio'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

interface QuestionProps {
  id: string
  number: string
  leftWord: string
  rightWord: string
  selectedValue?: string
  onValueChange: (value: string) => void
  className?: string
  isUpdating?: boolean
}

export function Question({
  id,
  number,
  leftWord,
  rightWord,
  selectedValue,
  onValueChange,
  className,
  isUpdating = false
}: QuestionProps) {
  return (
    <div className={clsx('flex flex-col items-start gap-2.5', className)}>
      <div className="text-sm font-medium text-gray-500 leading-5">
        {number}
      </div>

      <div className={clsx(
        "flex items-center justify-between p-4 relative self-stretch w-full bg-white rounded-lg border shadow-sm min-h-[56px] transition-all duration-300",
        isUpdating ? "border-blue-400 shadow-blue-200/50" : "border-gray-200",
        isUpdating && "animate-pulse"
      )}>
        <div className="text-right flex-1 font-medium text-gray-900 text-sm leading-5 pr-6">
          {leftWord}
        </div>

        <div className="relative flex items-center">
          {isUpdating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          )}
          <SimpleRadioGroup
            value={selectedValue}
            onChange={onValueChange}
            options={['2-0', '2-1', '1-2', '0-2']}
            className={clsx(
              "flex items-center gap-10 flex-shrink-0 transition-opacity",
              isUpdating && "opacity-50"
            )}
            disabled={isUpdating}
          />
        </div>

        <div className="flex-1 font-medium text-gray-900 text-sm leading-5 pl-6">
          {rightWord}
        </div>
      </div>
    </div>
  )
}