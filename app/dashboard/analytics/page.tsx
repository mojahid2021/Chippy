"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown, Users, Eye, Heart, Share2, Calendar } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your social media performance and engagement</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245.3K</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0.8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Followers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              -2.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +18.3% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chart visualization would go here</p>
              <p className="text-sm text-gray-500 mt-1">Integration with charting library needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">F</span>
                  </div>
                  <span className="font-medium">Facebook</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">89.2K</div>
                  <div className="text-xs text-gray-600">reach</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">T</span>
                  </div>
                  <span className="font-medium">Twitter</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">67.8K</div>
                  <div className="text-xs text-gray-600">reach</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">I</span>
                  </div>
                  <span className="font-medium">Instagram</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">88.3K</div>
                  <div className="text-xs text-gray-600">reach</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs">F</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Exciting product launch announcement...</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-xs text-gray-600">
                      <Heart className="h-3 w-3 mr-1" />
                      1.2K
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Share2 className="h-3 w-3 mr-1" />
                      245
                    </div>
                    <Badge variant="secondary" className="text-xs">Top Post</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="h-10 w-10 rounded-lg bg-linear-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-xs">I</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Behind the scenes look at our team...</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-xs text-gray-600">
                      <Heart className="h-3 w-3 mr-1" />
                      892
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Share2 className="h-3 w-3 mr-1" />
                      156
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Engagement rate increased by 15%</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Gained 234 new followers</p>
                <p className="text-xs text-gray-600">5 hours ago</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Post reached 50K impressions</p>
                <p className="text-xs text-gray-600">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}