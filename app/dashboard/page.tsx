"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserStore } from "@/lib/stores/userStore"
import { TrendingUp, Users, FileText, BarChart3 } from "lucide-react"

export default function Dashboard() {
  const { user } = useUserStore()

  const stats = [
    {
      title: "Connected Accounts",
      value: "2",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Scheduled Posts",
      value: "5",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "AI Generated Content",
      value: "12",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Growth Rate",
      value: "+23%",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with your social media automation today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Post scheduled for Facebook</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">AI generated Instagram caption</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <span className="text-sm font-medium">Create Post</span>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <span className="text-sm font-medium">View Analytics</span>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <span className="text-sm font-medium">Manage Accounts</span>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <span className="text-sm font-medium">Schedule Post</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}