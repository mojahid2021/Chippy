import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <form
          action={async () => {
            "use server"
            await signIn("facebook")
          }}
        >
          <Button type="submit" className="w-full">
            Sign in with Facebook
          </Button>
        </form>
        <form
          action={async () => {
            "use server"
            await signIn("instagram")
          }}
        >
          <Button type="submit" className="w-full">
            Sign in with Instagram
          </Button>
        </form>
      </div>
    </div>
  )
}