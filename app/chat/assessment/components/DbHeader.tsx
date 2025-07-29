import { XMarkIcon } from '@heroicons/react/24/outline'

interface DbHeaderProps {
  onClose?: () => void
}

export function DbHeader({ onClose }: DbHeaderProps) {
  return (
    <div className="absolute w-[1280px] h-[108px] top-0 left-0 bg-white border-b border-gray-200">
      <div className="flex w-full h-full items-center justify-between px-8">
        <header className="flex flex-col gap-1">
          <h1 className="font-semibold text-gray-900 text-2xl">
            Team Management Profile
          </h1>
          <p className="font-normal text-gray-500 text-sm">
            Reveal work preferences and clarify how team roles impact organisational success.
          </p>
        </header>

        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </div>
  )
}