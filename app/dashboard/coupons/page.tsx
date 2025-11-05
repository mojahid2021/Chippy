"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tags, Search, Plus, Edit, Trash2, Copy, Percent, DollarSign, TrendingUp } from "lucide-react"

export default function CouponsPage() {
  const coupons = [
    {
      id: 1,
      code: "WELCOME10",
      description: "Welcome discount for new customers",
      type: "percentage",
      value: "10%",
      usage: 234,
      limit: 1000,
      expires: "Dec 31, 2024",
      status: "active",
    },
    {
      id: 2,
      code: "SAVE20",
      description: "Summer sale discount",
      type: "percentage",
      value: "20%",
      usage: 567,
      limit: 500,
      expires: "Nov 30, 2024",
      status: "active",
    },
    {
      id: 3,
      code: "FLAT50",
      description: "Flat $50 off on orders over $200",
      type: "fixed",
      value: "$50",
      usage: 89,
      limit: 200,
      expires: "Nov 15, 2024",
      status: "active",
    },
    {
      id: 4,
      code: "FREESHIP",
      description: "Free shipping on all orders",
      type: "shipping",
      value: "Free",
      usage: 1234,
      limit: 5000,
      expires: "Dec 25, 2024",
      status: "active",
    },
    {
      id: 5,
      code: "EXPIRED15",
      description: "Expired promotional code",
      type: "percentage",
      value: "15%",
      usage: 450,
      limit: 500,
      expires: "Oct 31, 2024",
      status: "expired",
    },
  ]

  const stats = [
    { label: "Total Coupons", value: "24", icon: Tags, color: "text-blue-600" },
    { label: "Active", value: "18", icon: TrendingUp, color: "text-emerald-600" },
    { label: "Total Uses", value: "2,574", icon: Percent, color: "text-violet-600" },
    { label: "Revenue Impact", value: "$12.5k", icon: DollarSign, color: "text-amber-600" },
  ]

  const getTypeBadge = (type: string) => {
    const variants = {
      percentage: "bg-blue-100 text-blue-700",
      fixed: "bg-emerald-100 text-emerald-700",
      shipping: "bg-violet-100 text-violet-700",
    }
    return variants[type as keyof typeof variants] || variants.percentage
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      expired: "bg-slate-100 text-slate-700 border-slate-200",
    }
    return variants[status as keyof typeof variants] || variants.active
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
          <p className="text-sm text-slate-600 mt-0.5">Manage discount codes and promotions</p>
        </div>
        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Create Coupon
        </Button>
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

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupons by code or description..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
            Search
          </Button>
        </div>
      </Card>

      {/* Coupons List */}
      <div className="space-y-3">
        {coupons.map((coupon) => (
          <Card key={coupon.id} className="p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Tags className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-slate-900">{coupon.code}</h3>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <Badge className={`text-xs font-medium ${getTypeBadge(coupon.type)}`}>
                      {coupon.type}
                    </Badge>
                    <Badge className={`text-xs font-medium border ${getStatusBadge(coupon.status)}`}>
                      {coupon.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{coupon.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Discount Value</p>
                      <p className="font-semibold text-slate-900">{coupon.value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Usage</p>
                      <p className="font-semibold text-slate-900">{coupon.usage} / {coupon.limit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Usage Rate</p>
                      <p className="font-semibold text-blue-600">
                        {Math.round((coupon.usage / coupon.limit) * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Expires</p>
                      <p className="font-semibold text-slate-900">{coupon.expires}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-4">
                <Button variant="outline" size="sm" className="h-8">
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(coupon.usage / coupon.limit) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
