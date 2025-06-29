import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminGuard } from '@/modules/admin/AdminGuard';
import { ArrowLeft, Settings, Shield, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex h-full">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r bg-muted/10 p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <Link href="/app">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to App
                </Button>
              </Link>
              <div className="border-b pb-2">
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <p className="text-sm text-muted-foreground">System Administration</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2">
              <Link
                href="/app/admin"
                className="flex items-center space-x-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/app/admin/google-auth"
                className="flex items-center space-x-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <Shield className="h-4 w-4" />
                <span>Google Auth Config</span>
              </Link>
            </nav>

            {/* Admin Info */}
            <div className="mt-8">
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">System Administrator</p>
                  <p className="mt-1">You have full system access</p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </AdminGuard>
  );
}
