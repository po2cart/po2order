"use client"

import React from "react"
import Link from "next/link"
import useSWR from "swr"
import { api } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle, AlertCircle, Search, Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR("/api/purchase-orders", () => api.purchaseOrders.list())
  const pos = data?.data || []

  const stats = {
    pending: pos.filter((p: any) => p.status === 'review' || p.status === 'processing').length,
    held: pos.filter((p: any) => p.status === 'held').length,
    completed: pos.filter((p: any) => p.status === 'approved' || p.status === 'pushed').length,
  }

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
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Held</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.held}</div>
              <p className="text-xs text-muted-foreground">Action required</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
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
          
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="pending" className="mt-4">
                <POTable pos={pos.filter((p: any) => p.status === "review" || p.status === "processing")} />
              </TabsContent>
              <TabsContent value="held" className="mt-4">
                <POTable pos={pos.filter((p: any) => p.status === "held")} />
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                <POTable pos={pos.filter((p: any) => p.status === "approved" || p.status === "pushed")} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function POTable({ pos }: { pos: any[] }) {
  if (pos.length === 0) {
    return (
      <Card className="flex h-32 items-center justify-center text-muted-foreground italic">
        No purchase orders found
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pos.map((po) => (
            <TableRow key={po.id}>
              <TableCell className="font-medium">{po.orderNumber || 'Pending'}</TableCell>
              <TableCell>{po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>${Number(po.total || 0).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={
                  po.status === "review" ? "warning" : 
                  po.status === "held" ? "destructive" : 
                  po.status === "approved" || po.status === "pushed" ? "success" : "secondary"
                }>
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
