'use client'

import { FileText, Calendar, Building, User } from 'lucide-react'

interface ReportHeaderProps {
  title: string
  metadata: any
  subscriptionId: string
}

export function ReportHeader({ title, metadata, subscriptionId }: ReportHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">Subscription ID: {subscriptionId}</p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {metadata && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {metadata.userName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium">{metadata.userName}</p>
              </div>
            </div>
          )}
          
          {metadata.organizationName && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Organization</p>
                <p className="text-sm font-medium">{metadata.organizationName}</p>
              </div>
            </div>
          )}
          
          {metadata.reportType && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Report Type</p>
                <p className="text-sm font-medium">{metadata.reportType}</p>
              </div>
            </div>
          )}
          
          {metadata.completedAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-sm font-medium">
                  {new Date(metadata.completedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {metadata.estimatedReadTime && (
        <div className="mt-4 text-sm text-gray-500">
          Estimated reading time: {metadata.estimatedReadTime} minutes
        </div>
      )}
    </div>
  )
}