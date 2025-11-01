export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const session = await auth()
  // if (!session) {
  //   redirect("/auth/signin")
  // }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 p-4">
        <nav>
          <ul className="space-y-2">
            <li><a href="/dashboard" className="block p-2 hover:bg-gray-200">Dashboard</a></li>
            <li><a href="/dashboard/accounts" className="block p-2 hover:bg-gray-200">Accounts</a></li>
            <li><a href="/dashboard/content" className="block p-2 hover:bg-gray-200">Content</a></li>
            <li><a href="/dashboard/analytics" className="block p-2 hover:bg-gray-200">Analytics</a></li>
            <li><a href="/dashboard/settings" className="block p-2 hover:bg-gray-200">Settings</a></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )
}