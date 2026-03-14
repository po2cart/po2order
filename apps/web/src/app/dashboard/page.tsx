"use client"

import React from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle, AlertCircle, Search } from "lucide-react"

const MOCK_POS = [
  { id: "po-1", customer: "Crisp NZ", orderNo: "PO-12345", date: "2026-03-12", status: "review", items: 12, total: 1540.50 },
  { id: "po-2", customer: "Southland Food", orderNo: "PO-67890", date: "2026-03-13", status: "review", items: 5, total: 450.00 },
  { id: "po-3", customer: "Otago Wholesalers", orderNo: "OW-2233", date: "2026-03-14", status: "held", items: 25, total: 3200.75 },
  { id: "po-4", customer: "Crisp NZ", orderNo: "PO-12346", date: "2026-03-10", status: "pushed", items: 8, total: 890.20 },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Upload PO
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Held</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Action required</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">145</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.2%</div>
              <p className="text-xs text-muted-foreground">AI Extraction</p>
            </CardContent>
          </Card>
        </div>

        {/* PO Table */}
        <Tabs defaultValue="pending" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="held">Held</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search POs..."
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <TabsContent value="pending" className="mt-4">
            <POTable pos={MOCK_POS.filter(p => p.status === "review")} />
          </TabsContent>
          <TabsContent value="held" className="mt-4">
            <POTable pos={MOCK_POS.filter(p => p.status === "held")} />
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            <POTable pos={MOCK_POS.filter(p => p.status === "pushed")} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function POTable({ pos }: { pos: typeof MOCK_POS }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Order Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pos.map((po) => (
            <TableRow key={po.id}>
              <TableCell className="font-medium">{po.customer}</TableCell>
              <TableCell>{po.orderNo}</TableCell>
              <TableCell>{po.date}</TableCell>
              <TableCell>{po.items}</TableCell>
              <TableCell>${po.total.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={po.status === "review" ? "warning" : po.status === "held" ? "destructive" : "success"}>
                  {po.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/review/${po.id}`}>Review</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}
