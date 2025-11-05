"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Search, Filter, Package, MapPin, Clock, CheckCircle, Plus } from "lucide-react"

export default function ShippingPage() {
  const shipments = [
    {
      id: "SHIP-001",
      order: "ORD-2024-001",
      customer: "John Doe",
      address: "123 Main St, New York, NY",
      carrier: "FedEx",
      tracking: "FDX123456789",
      status: "in_transit",
      date: "Nov 6, 2024",
      estimated: "Nov 8, 2024",
    },
    {
      id: "SHIP-002",
      order: "ORD-2024-003",
      customer: "Sarah Smith",
      address: "456 Oak Ave, Los Angeles, CA",
      carrier: "UPS",
      tracking: "UPS987654321",
      status: "delivered",
      date: "Nov 5, 2024",
      estimated: "Nov 7, 2024",
    },
    {
      id: "SHIP-003",
      order: "ORD-2024-005",
      customer: "Mike Johnson",
      address: "789 Pine Rd, Chicago, IL",
      carrier: "USPS",
      tracking: "USPS456789123",
      status: "pending",
      date: "Nov 6, 2024",
      estimated: "Nov 9, 2024",
    },
    {
      id: "SHIP-004",
      order: "ORD-2024-007",
      customer: "Emily Brown",
      address: "321 Elm St, Houston, TX",
      carrier: "DHL",
      tracking: "DHL789123456",
      status: "out_for_delivery",
      date: "Nov 4, 2024",
      estimated: "Nov 6, 2024",
    },
  ]

  const stats = [
    { label: "Total Shipments", value: "1,234", icon: Package, color: "text-blue-600" },
    { label: "In Transit", value: "89", icon: Truck, color: "text-violet-600" },
    { label: "Out for Delivery", value: "45", icon: MapPin, color: "text-amber-600" },
    { label: "Delivered", value: "1,100", icon: CheckCircle, color: "text-emerald-600" },
  ]

  const carriers = [
    { name: "FedEx", count: 345, status: "active" },
    { name: "UPS", count: 289, status: "active" },
    { name: "USPS", count: 234, status: "active" },
    { name: "DHL", count: 156, status: "active" },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
      in_transit: "bg-blue-100 text-blue-700 border-blue-200",
      out_for_delivery: "bg-violet-100 text-violet-700 border-violet-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      delivered: "Delivered",
      in_transit: "In Transit",
      out_for_delivery: "Out for Delivery",
      pending: "Pending",
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shipping</h1>
          <p className="text-sm text-slate-600 mt-0.5">Track deliveries and manage shipping</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filter
          </Button>
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create Shipment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipments List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <Card className="p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by tracking number, order ID, or customer..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
                Search
              </Button>
            </div>
          </Card>

          {/* Shipments */}
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <Card key={shipment.id} className="p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{shipment.id}</h3>
                        <Badge variant="outline" className="text-xs">
                          {shipment.order}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{shipment.customer}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs font-medium border ${getStatusBadge(shipment.status)}`}>
                    {getStatusLabel(shipment.status)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <span className="text-slate-600">{shipment.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{shipment.carrier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Track: {shipment.tracking}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Est. Delivery: {shipment.estimated}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                  <Button variant="outline" size="sm" className="flex-1 h-8">
                    Track Package
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Carriers Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3">Shipping Carriers</h3>
            <div className="space-y-3">
              {carriers.map((carrier) => (
                <div key={carrier.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{carrier.name}</p>
                    <p className="text-xs text-slate-600">{carrier.count} shipments</p>
                  </div>
                  <Badge className="text-xs bg-emerald-100 text-emerald-700">
                    {carrier.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3 h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Carrier
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
