"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
  MoreHorizontal
} from "lucide-react"

export default function ReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [status, setStatus] = useState("review")

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
          <h1 className="text-lg font-semibold">Review Purchase Order: PO-12345</h1>
          <Badge variant="warning">Manual Review</Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <Button variant="destructive" size="sm">Reject</Button>
          <Button variant="outline" size="sm">Hold</Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Check className="mr-2 h-4 w-4" />
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
          <div className="flex-1 p-8">
            <Card className="mx-auto aspect-[1/1.4] max-w-2xl bg-white shadow-lg flex flex-col p-12">
               {/* Mock PO Content */}
               <div className="flex justify-between items-start mb-12">
                  <div>
                    <h2 className="text-2xl font-bold">PURCHASE ORDER</h2>
                    <p className="text-sm text-muted-foreground">Crisp NZ Limited</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">PO-12345</p>
                    <p className="text-xs text-muted-foreground">March 12, 2026</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8 mb-12">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Bill To</p>
                    <p className="text-sm font-medium italic underline decoration-yellow-400 decoration-2">Southland Food Distribution</p>
                    <p className="text-xs">123 Industrial Way</p>
                    <p className="text-xs">Invercargill, 9810</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Ship To</p>
                    <p className="text-sm">Main Warehouse</p>
                    <p className="text-xs">456 Delivery Lane</p>
                    <p className="text-xs">Invercargill, 9812</p>
                  </div>
               </div>

               <div className="border-t pt-4">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold border-b pb-2 mb-2">
                    <div className="col-span-6">DESCRIPTION</div>
                    <div className="col-span-2 text-right">QTY</div>
                    <div className="col-span-2 text-right">PRICE</div>
                    <div className="col-span-2 text-right">TOTAL</div>
                  </div>
                  {[
                    { desc: "Whole Milk 2L", qty: 24, price: 4.50 },
                    { desc: "Butter 500g", qty: 48, price: 6.20 },
                    { desc: "Cheese Blocks 1kg", qty: 12, price: 15.00 },
                  ].map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 text-xs py-1 border-b border-dashed border-muted">
                      <div className="col-span-6">{item.desc}</div>
                      <div className="col-span-2 text-right">{item.qty}</div>
                      <div className="col-span-2 text-right">{item.price.toFixed(2)}</div>
                      <div className="col-span-2 text-right">{(item.qty * item.price).toFixed(2)}</div>
                    </div>
                  ))}
               </div>
               
               <div className="mt-auto pt-8 flex justify-end">
                  <div className="w-32 space-y-1">
                    <div className="flex justify-between text-xs"><span>Subtotal:</span><span>$1,540.50</span></div>
                    <div className="flex justify-between text-xs"><span>GST (15%):</span><span>$231.08</span></div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1"><span>Total:</span><span>$1,771.58</span></div>
                  </div>
               </div>
            </Card>
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
                    <Badge variant="outline" className="text-[10px]">98% Confidence</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="orderNo">Order Number</Label>
                      <Input id="orderNo" defaultValue="PO-12345" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="orderDate">Date</Label>
                      <Input id="orderDate" type="date" defaultValue="2026-03-12" />
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
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">C</div>
                        <div>
                          <p className="text-xs font-medium">Crisp NZ Limited (CRISP001)</p>
                          <p className="text-[10px] text-muted-foreground">Invercargill, Southland</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deliveryAddress">Delivery Address</Label>
                      <Input id="deliveryAddress" defaultValue="456 Delivery Lane, Invercargill" />
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Line Items */}
                <section className="space-y-4 pb-12">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Line Items (3)</h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary">
                      + Add Item
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { code: "MILK-2L-W", desc: "Whole Milk 2L", qty: 24, price: 4.50 },
                      { code: "BUTTER-500G", desc: "Butter 500g", qty: 48, price: 6.20 },
                      { code: "CHEESE-1KG", desc: "Cheese Blocks 1kg", qty: 12, price: 15.00 },
                    ].map((item, i) => (
                      <div key={i} className="p-3 border rounded-md space-y-3 relative group">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <Input className="h-7 text-xs font-mono" defaultValue={item.code} />
                              <Badge variant="outline" className="h-5 text-[9px] px-1 font-normal">Mapped</Badge>
                            </div>
                            <Input className="h-7 text-xs" defaultValue={item.desc} />
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <div className="space-y-1">
                              <Label className="text-[10px]">Quantity</Label>
                              <Input className="h-7 text-xs" defaultValue={item.qty} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px]">Price</Label>
                              <Input className="h-7 text-xs" defaultValue={item.price.toFixed(2)} />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[10px]">Total</Label>
                              <div className="h-7 flex items-center px-2 text-xs font-medium bg-muted/50 rounded-md border">
                                ${(item.qty * item.price).toFixed(2)}
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="validation" className="m-0 p-6 space-y-4">
                 <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-md flex gap-3">
                   <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                   <div className="space-y-1">
                      <p className="text-sm font-semibold text-yellow-800">Duplicate PO Warning</p>
                      <p className="text-xs text-yellow-700">A purchase order with number PO-12345 was already processed for Crisp NZ on 2026-02-15.</p>
                      <Button variant="link" className="p-0 h-auto text-xs text-yellow-800 underline decoration-yellow-600">View Previous PO</Button>
                   </div>
                 </div>

                 <div className="p-3 border border-blue-200 bg-blue-50 rounded-md flex gap-3">
                   <Info className="h-5 w-5 text-blue-600 shrink-0" />
                   <div className="space-y-1">
                      <p className="text-sm font-semibold text-blue-800">SKU Mapping</p>
                      <p className="text-xs text-blue-700">"Whole Milk 2L" was automatically mapped to ERP code MILK-2L-W based on history.</p>
                   </div>
                 </div>
              </TabsContent>
            </ScrollArea>

            {/* Sticky Footer in Right Panel */}
            <div className="border-t bg-background p-4 flex gap-2">
              <Button variant="outline" className="flex-1">
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" /> Done
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
