'use client';

import { ArrowLeft, Bell, ChevronDown, Palette, UserRound, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ScrollableRegion } from '@/components/ScrollableRegion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SettingsModule {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SETTINGS_MODULES: SettingsModule[] = [
  { href: '/app/settings/user', label: 'User', icon: UserRound },
  { href: '/app/settings/appearance', label: 'Appearance', icon: Palette },
  { href: '/app/settings/notifications', label: 'Notifications', icon: Bell },
];

function getActiveSettingsModule(pathname: string): SettingsModule {
  return (
    [...SETTINGS_MODULES]
      .sort((a, b) => b.href.length - a.href.length)
      .find((module) => pathname === module.href || pathname.startsWith(`${module.href}/`)) ??
    SETTINGS_MODULES[0]
  );
}

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1">
      {_renderDesktopSidebar(pathname)}
      <div className="flex min-h-0 flex-1 flex-col">
        {_renderMobileHeader(pathname)}
        <ScrollableRegion
          regionId="content"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        >
          <div className="p-4 lg:p-6">{children}</div>
        </ScrollableRegion>
      </div>
    </div>
  );
}

function _renderDesktopSidebar(pathname: string) {
  const activeModule = getActiveSettingsModule(pathname);

  return (
    <div className="hidden w-64 border-r bg-muted/10 p-4 lg:block">
      <div className="h-full space-y-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            nativeButton={false}
            render={<Link href="/app" role="link" />}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to App</span>
          </Button>
          <div className="border-b pb-2">
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground">Personal settings</p>
          </div>
        </div>

        <nav aria-label="Settings sections" className="space-y-2">
          {SETTINGS_MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = module.href === activeModule.href;
            return (
              <Link
                key={module.href}
                href={module.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center space-x-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                  isActive && 'bg-muted font-medium'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{module.label}</span>
              </Link>
            );
          })}
        </nav>

        <Card className="mt-8 p-3">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Personal settings</p>
            <p className="mt-1">More settings will appear here as the account grows.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function _renderMobileHeader(pathname: string) {
  const activeModule = getActiveSettingsModule(pathname);
  const ActiveIcon = activeModule.icon;

  return (
    <div className="shrink-0 border-b bg-background p-4 lg:hidden">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          nativeButton={false}
          render={<Link href="/app" aria-label="Back to app" role="link" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'max-w-[70%] gap-2')}
          >
            <ActiveIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{activeModule.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              {SETTINGS_MODULES.map((module) => {
                const Icon = module.icon;
                const isActive = module.href === activeModule.href;
                return (
                  <DropdownMenuItem
                    key={module.href}
                    render={<Link href={module.href} />}
                    className={cn('cursor-pointer gap-2', isActive && 'bg-muted font-medium')}
                  >
                    <Icon className="h-4 w-4" />
                    {module.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
