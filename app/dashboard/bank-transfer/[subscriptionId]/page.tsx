'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useUserStore } from '@/lib/stores/userStore'

export default function BankTransferConfirmationPage() {
  const params = useParams()
  const subscriptionId = params.subscriptionId as string
  const router = useRouter()
  const { user, isLoading } = useUserStore()

  const [formData, setFormData] = useState({
    accountNumber: '',
    transactionId: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin')
    }
  }, [isLoading, user, router])

  if (!user) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/public/bank-transfer/${subscriptionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
      } else {
        setError(data.message || 'Failed to submit bank transfer details')
      }
    } catch (error) {
      console.error('Bank transfer submission error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-success mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Payment Confirmed!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your bank transfer details have been submitted successfully.
                Your subscription will be activated shortly.
              </p>
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Bank Transfer Payment
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete your payment by transferring funds to the account below, then submit your transfer details.
          </p>
        </div>

        {/* Payment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Payment Information
            </CardTitle>
            <CardDescription>
              Please transfer the payment amount to the following bank account:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Bank Name</Label>
                <p className="text-sm text-foreground mt-1">Your Bank Name</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">Account Name</Label>
                <p className="text-sm text-foreground mt-1">Your Company Name</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">Account Number</Label>
                <p className="text-sm text-foreground mt-1 font-mono">1234567890</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground">Routing Number</Label>
                <p className="text-sm text-foreground mt-1 font-mono">123456789</p>
              </div>
            </div>
            <div className="bg-warning-soft border border-warning/30 rounded-md p-4">
              <p className="text-sm text-warning">
                <strong>Important:</strong> Include your subscription ID <code className="bg-warning-soft px-1 rounded">{subscriptionId}</code> in the transfer reference to ensure proper processing.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit Transfer Details</CardTitle>
            <CardDescription>
              After completing the bank transfer above, enter your transfer details below to confirm the payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="accountNumber">
                  Account Number *
                </Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your account number"
                  required
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The account number from which the transfer was made
                </p>
              </div>

              <div>
                <Label htmlFor="transactionId">
                  Transaction ID *
                </Label>
                <Input
                  id="transactionId"
                  name="transactionId"
                  type="text"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                  placeholder="Enter transaction ID"
                  required
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The unique transaction reference from your bank
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !formData.accountNumber || !formData.transactionId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Transfer Details'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team for assistance with your payment.
          </p>
        </div>
      </div>
    </div>
  )
}