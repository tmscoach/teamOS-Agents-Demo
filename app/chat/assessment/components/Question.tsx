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
    <div className={clsx('flex flex-col items-start gap-2', className)}>
      <div className="text-sm font-normal text-gray-500 mb-1">
        {number}
      </div>

      <div className="flex items-center justify-between p-6 relative self-stretch w-full bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-right w-[160px] font-normal text-gray-900 text-base">
          {leftWord}
        </div>

        <SimpleRadioGroup
          value={selectedValue}
          onChange={onValueChange}
          options={['2-0', '2-1', '1-2', '0-2']}
          className="flex items-center gap-12"
        />

        <div className="w-[160px] font-normal text-gray-900 text-base">
          {rightWord}
        </div>
      </div>
    </div>
  )
}