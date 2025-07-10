import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - TeamOS Agents Demo',
  description: 'Sign in to your TeamOS account',
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}