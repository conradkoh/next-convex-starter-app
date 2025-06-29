'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminGuard } from '@/modules/admin/AdminGuard';
import { ArrowLeft, Menu, Settings, Shield, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between lg:justify-start">
          <Link href="/app">
            <Button variant="ghost" size="sm" className="justify-start">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to App</span>
            </Button>
          </Link>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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
          onClick={() => setSidebarOpen(false)}
        >
          <Settings className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/app/admin/google-auth"
          className="flex items-center space-x-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
          onClick={() => setSidebarOpen(false)}
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
  );

  return (
    <AdminGuard>
      <div className="flex h-full">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4 mr-2" />
              Admin Menu
            </Button>
            <Link href="/app">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div
              className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r p-4"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <SidebarContent />
            </div>
            {/* Backdrop area to close sidebar */}
            <div
              className="fixed inset-0 -z-10"
              onClick={() => setSidebarOpen(false)}
              onKeyDown={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 border-r bg-muted/10 p-4">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="pt-20 lg:pt-0 p-4 lg:p-6">{children}</div>
        </div>
      </div>
    </AdminGuard>
  );
}
