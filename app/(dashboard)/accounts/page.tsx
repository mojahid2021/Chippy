import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Accounts() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Connected Accounts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Facebook</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Status: Not Connected</p>
            <Button className="mt-2">Connect Facebook</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Instagram</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Status: Not Connected</p>
            <Button className="mt-2">Connect Instagram</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}