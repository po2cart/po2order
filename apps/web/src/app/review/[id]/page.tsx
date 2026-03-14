"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ChevronLeft, 
  Save, 
  Check, 
  X, 
  AlertTriangle, 
  Search, 
  History, 
  ExternalLink,
  Info,
  MoreHorizontal,
  Loader2
} from "lucide-react"

export default function ReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/purchase-orders/${id}` : null,
    () => api.purchaseOrders.get(id as string)
  )

  const [isProcessing, setIsProcessing] = useState(false)
  const po = data?.data

  const handleAction = async (action: 'hold' | 'release' | 'approve') => {
    if (!id) return
    setIsProcessing(true)
    try {
      if (action === 'hold') await api.purchaseOrders.hold(id as string)
      else if (action === 'release') await api.purchaseOrders.release(id as string)
      else if (action === 'approve') await api.purchaseOrders.approve(id as string)
      
      await mutate()
      if (action === 'approve') {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error(`Failed to ${action} PO:`, err)
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading purchase order...</span>
      </div>
    )
  }

  if (error || !po) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-bold">Failed to load purchase order</h2>
          <p className="text-muted-foreground">{error?.message || "Order not found"}</p>
        </div>
        <Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="flex h-14 items-center border-b px-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Review Purchase Order: {po.orderNumber || 'Pending'}</h1>
          <Badge variant={po.status === 'review' ? 'warning' : 'outline'}>
            {po.status.toUpperCase()}
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={isProcessing}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button variant="outline" size="sm" disabled={isProcessing}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <Button variant="destructive" size="sm" disabled={isProcessing}>Reject</Button>
          
          {po.status === 'held' ? (
            <Button variant="outline" size="sm" onClick={() => handleAction('release')} disabled={isProcessing}>
              Release
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleAction('hold')} disabled={isProcessing}>
              Hold
            </Button>
          )}
          
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700" 
            onClick={() => handleAction('approve')}
            disabled={isProcessing || po.status === 'approved'}
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Approve & Push
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: PDF Viewer Mock */}
        <div className="flex flex-1 flex-col border-r bg-muted/20">
          <div className="flex h-10 items-center justify-between border-b bg-background px-4">
            <span className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Source Document</span>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" className="h-7 w-7"><Search className="h-3.5 w-3.5" /></Button>
               <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div className="flex-1 p-8 overflow-auto">
            {po.sourceAttachment ? (
              <div className="w-full h-full border rounded bg-white flex items-center justify-center italic text-muted-foreground">
                {/* In a real app, this would be a PDF viewer component */}
                <iframe 
                  src={`/api/documents/${po.sourceAttachment}`} 
                  className="w-full h-full border-none"
                  title="PO Document"
                />
              </div>
            ) : (
              <Card className="mx-auto aspect-[1/1.4] max-w-2xl bg-white shadow-lg flex flex-col p-12">
                 <div className="flex justify-between items-start mb-12">
                    <div>
                      <h2 className="text-2xl font-bold uppercase">Purchase Order</h2>
                      <p className="text-sm text-muted-foreground">{po.customer?.name || 'Unknown Customer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{po.orderNumber || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">
                        {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Bill To</p>
                      <p className="text-sm font-medium">{po.customer?.name || 'N/A'}</p>
                      <p className="text-xs">{po.customer?.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Ship To</p>
                      <p className="text-sm font-medium">{po.deliveryAddressLine1 || 'N/A'}</p>
                      <p className="text-xs">{po.deliveryCity}, {po.deliveryPostalCode}</p>
                    </div>
                 </div>

                 <div className="border-t pt-4">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold border-b pb-2 mb-2">
                      <div className="col-span-6">DESCRIPTION</div>
                      <div className="col-span-2 text-right">QTY</div>
                      <div className="col-span-2 text-right">PRICE</div>
                      <div className="col-span-2 text-right">TOTAL</div>
                    </div>
                    {po.lines?.map((line: any, i: number) => (
                      <div key={i} className="grid grid-cols-12 gap-2 text-xs py-1 border-b border-dashed border-muted">
                        <div className="col-span-6">{line.description || line.productCode}</div>
                        <div className="col-span-2 text-right">{Number(line.quantity)}</div>
                        <div className="col-span-2 text-right">{line.unitPrice ? Number(line.unitPrice).toFixed(2) : '-'}</div>
                        <div className="col-span-2 text-right">{line.totalPrice ? Number(line.totalPrice).toFixed(2) : '-'}</div>
                      </div>
                    ))}
                 </div>
                 
                 <div className="mt-auto pt-8 flex justify-end">
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-xs"><span>Subtotal:</span><span>${Number(po.subtotal || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between text-xs"><span>GST (15%):</span><span>${Number(po.tax || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm font-bold border-t pt-1"><span>Total:</span><span>${Number(po.total || 0).toFixed(2)}</span></div>
                    </div>
                 </div>
              </Card>
            )}
          </div>
        </div>

        {/* Right Panel: Data Editor */}
        <div className="w-[450px] flex flex-col bg-background">
          <Tabs defaultValue="extracted" className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b bg-muted/30 px-4 pt-2">
              <TabsList className="bg-transparent">
                <TabsTrigger value="extracted" className="data-[state=active]:bg-background">Data Extraction</TabsTrigger>
                <TabsTrigger value="validation" className="data-[state=active]:bg-background">Validation</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="extracted" className="m-0 p-6 space-y-6">
                {/* Header Information */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Header Information</h3>
                    <Badge variant="outline" className="text-[10px]">AI Extracted</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="orderNo">Order Number</Label>
                      <Input id="orderNo" defaultValue={po.orderNumber || ''} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="orderDate">Date</Label>
                      <Input id="orderDate" type="date" defaultValue={po.orderDate ? new Date(po.orderDate).toISOString().split('T')[0] : ''} />
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Customer Section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Customer</h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                      <Search className="mr-1 h-3 w-3" /> Find
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Selected Customer</Label>
                      {po.customer ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {po.customer.name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{po.customer.name} ({po.customer.code})</p>
                            <p className="text-[10px] text-muted-foreground">{po.customer.email || 'No email'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 border border-dashed rounded-md text-center text-xs text-muted-foreground italic">
                          No customer matched
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deliveryAddress">Delivery Address</Label>
                      <Input id="deliveryAddress" defaultValue={`${po.deliveryAddressLine1 || ''}, ${po.deliveryCity || ''}`} />
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Line Items */}
                <section className="space-y-4 pb-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Line Items ({po.lines?.length || 0})</h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary">
                      + Add Item
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {po.lines?.map((line: any, i: number) => (
                      <div key={i} className="p-3 border rounded-md space-y-3 relative group">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <Input className="h-7 text-xs font-mono" defaultValue={line.productCode || ''} placeholder="SKU" />
                              {line.productId && <Badge variant="outline" className="h-5 text-[9px] px-1 font-normal">Mapped</Badge>}
                            </div>
                            <Input className="h-7 text-xs" defaultValue={line.description || ''} placeholder="Description" />
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <div className="space-y-1">
                              <Label className="text-[10px]">Quantity</Label>
                              <Input className="h-7 text-xs" defaultValue={Number(line.quantity)} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px]">Price</Label>
                              <Input className="h-7 text-xs" defaultValue={line.unitPrice ? Number(line.unitPrice).toFixed(2) : ''} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px]">Total</Label>
                              <div className="h-7 flex items-center px-2 text-xs font-medium bg-muted/50 rounded-md border">
                                ${line.totalPrice ? Number(line.totalPrice).toFixed(2) : '0.00'}
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="validation" className="m-0 p-6 space-y-4">
                 {po.errorDetails ? (
                   <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-md flex gap-3">
                     <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                     <div className="space-y-1">
                        <p className="text-sm font-semibold text-destructive">Extraction Error</p>
                        <p className="text-xs text-destructive/80">{po.errorDetails}</p>
                     </div>
                   </div>
                 ) : (
                   <div className="p-3 border border-green-200 bg-green-50 rounded-md flex gap-3">
                     <Check className="h-5 w-5 text-green-600 shrink-0" />
                     <div className="space-y-1">
                        <p className="text-sm font-semibold text-green-800">Clean Extraction</p>
                        <p className="text-xs text-green-700">All required fields were successfully extracted with high confidence.</p>
                     </div>
                   </div>
                 )}

                 <div className="p-3 border border-blue-200 bg-blue-50 rounded-md flex gap-3">
                   <Info className="h-5 w-5 text-blue-600 shrink-0" />
                   <div className="space-y-1">
                      <p className="text-sm font-semibold text-blue-800">SKU Mapping</p>
                      <p className="text-xs text-blue-700">Product codes are matched against your local catalog.</p>
                   </div>
                 </div>
              </TabsContent>
            </ScrollArea>

            {/* Sticky Footer in Right Panel */}
            <div className="border-t bg-background p-4 flex gap-2">
              <Button variant="outline" className="flex-1" disabled={isProcessing}>
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAction('approve')}
                disabled={isProcessing || po.status === 'approved'}
              >
                <Check className="mr-2 h-4 w-4" /> Done
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
