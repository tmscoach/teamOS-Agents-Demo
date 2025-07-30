import { SimpleRadioGroup } from './simple-radio'
import clsx from 'clsx'

interface QuestionProps {
  id: string
  number: string
  leftWord: string
  rightWord: string
  selectedValue?: string
  onValueChange: (value: string) => void
  className?: string
}

export function Question({
  id,
  number,
  leftWord,
  rightWord,
  selectedValue,
  onValueChange,
  className
}: QuestionProps) {
  return (
    <div className={clsx('flex flex-col items-start gap-2.5', className)}>
      <div className="text-sm font-medium text-gray-500 leading-5">
        {number}
      </div>

      <div className="flex items-center justify-between p-4 relative self-stretch w-full bg-white rounded-lg border border-gray-200 shadow-sm min-h-[56px]">
        <div className="text-right w-[140px] font-medium text-gray-900 text-sm leading-5 pr-6 flex-shrink-0">
          {leftWord}
        </div>

        <SimpleRadioGroup
          value={selectedValue}
          onChange={onValueChange}
          options={['2-0', '2-1', '1-2', '0-2']}
          className="flex items-center gap-10 flex-shrink-0"
        />

        <div className="w-[140px] font-medium text-gray-900 text-sm leading-5 pl-6 flex-shrink-0">
          {rightWord}
        </div>
      </div>
    </div>
  )
}