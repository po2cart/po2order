"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, FileText, Settings, BarChart3, Package, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Purchase Orders", href: "/purchase-orders", icon: FileText },
  { name: "Products", href: "/products", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-background md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary">
              <FileText className="h-6 w-6" />
              <span>PO2Order</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center gap-3 px-3">
              <UserButton afterSignOutUrl="/" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Gemini User</span>
                <span className="text-xs text-muted-foreground">Free Plan</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b bg-background px-6 md:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <FileText className="h-6 w-6" />
            <span>PO2Order</span>
          </Link>
          <div className="ml-auto">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
