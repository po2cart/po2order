import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Link href="/dashboard" className="text-blue-500 underline">Go to Dashboard</Link>
    </div>
  )
}
