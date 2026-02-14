'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  FixedSizeDialog,
  FixedSizeDialogActions,
  FixedSizeDialogContent,
  FixedSizeDialogDescription,
  FixedSizeDialogSidebar,
  FixedSizeDialogTitle,
} from '@/components/ui/fixed-size-dialog';

export default function FixedSizeDialogDemo() {
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [isScrollingOpen, setIsScrollingOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWithDescriptionOpen, setIsWithDescriptionOpen] = useState(false);

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">FixedSizeDialog Component Demo</h1>
          <p className="text-muted-foreground">
            Demonstration of the FixedSizeDialog component with various configurations
          </p>
        </div>

        {/* Demo Buttons */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Basic Dialog */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Basic Dialog</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Simple dialog with title, content, and action buttons
            </p>
            <Dialog open={isBasicOpen} onOpenChange={setIsBasicOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Open Basic Dialog</Button>
              </DialogTrigger>
              <FixedSizeDialog>
                <FixedSizeDialogTitle>Basic Dialog Title</FixedSizeDialogTitle>
                <FixedSizeDialogContent>
                  <div className="space-y-4">
                    <p className="text-foreground">
                      This is a basic dialog with a simple content area. The dialog has a fixed size
                      on desktop and goes fullscreen on mobile devices.
                    </p>
                    <p className="text-muted-foreground">
                      The title stays at the top and the actions stay at the bottom, while this
                      content area is scrollable when needed.
                    </p>
                  </div>
                </FixedSizeDialogContent>
                <FixedSizeDialogActions>
                  <Button variant="outline" onClick={() => setIsBasicOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsBasicOpen(false)}>Save Changes</Button>
                </FixedSizeDialogActions>
              </FixedSizeDialog>
            </Dialog>
          </div>

          {/* Dialog with Description */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Dialog with Description</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Includes accessibility description for screen readers
            </p>
            <Dialog open={isWithDescriptionOpen} onOpenChange={setIsWithDescriptionOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Open with Description</Button>
              </DialogTrigger>
              <FixedSizeDialog>
                <FixedSizeDialogTitle>User Profile Settings</FixedSizeDialogTitle>
                <FixedSizeDialogDescription>
                  Update your profile information and preferences. Changes will be saved to your
                  account.
                </FixedSizeDialogDescription>
                <FixedSizeDialogContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground">Personal Information</h3>
                      <p className="text-sm text-muted-foreground">
                        This dialog includes a description element that provides additional context
                        for screen readers, improving accessibility (WCAG compliance).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground">Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        The description appears between the title and the main content, providing
                        important context about the dialog's purpose.
                      </p>
                    </div>
                  </div>
                </FixedSizeDialogContent>
                <FixedSizeDialogActions>
                  <Button variant="outline" onClick={() => setIsWithDescriptionOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsWithDescriptionOpen(false)}>Save</Button>
                </FixedSizeDialogActions>
              </FixedSizeDialog>
            </Dialog>
          </div>

          {/* Scrolling Content Dialog */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Scrolling Content</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Demonstrates fixed header/footer with scrollable content
            </p>
            <Dialog open={isScrollingOpen} onOpenChange={setIsScrollingOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Open Scrolling Dialog</Button>
              </DialogTrigger>
              <FixedSizeDialog>
                <FixedSizeDialogTitle>Terms and Conditions</FixedSizeDialogTitle>
                <FixedSizeDialogContent>
                  <div className="space-y-4">
                    <p className="text-foreground">
                      This dialog contains a lot of content to demonstrate the scrolling behavior.
                      Notice how the title and actions remain fixed while you scroll through this
                      content.
                    </p>
                    {Array.from({ length: 15 }, (_, i) => (
                      <div key={i} className="space-y-2">
                        <h3 className="font-semibold text-foreground">Section {i + 1}</h3>
                        <p className="text-muted-foreground">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                          veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                          commodo consequat.
                        </p>
                      </div>
                    ))}
                    <p className="text-foreground">
                      You've reached the end of the content. The action buttons should always be
                      visible at the bottom.
                    </p>
                  </div>
                </FixedSizeDialogContent>
                <FixedSizeDialogActions>
                  <Button variant="outline" onClick={() => setIsScrollingOpen(false)}>
                    Decline
                  </Button>
                  <Button onClick={() => setIsScrollingOpen(false)}>Accept</Button>
                </FixedSizeDialogActions>
              </FixedSizeDialog>
            </Dialog>
          </div>

          {/* Dialog with Sidebar */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Dialog with Sidebar</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Shows sidebar with title alignment and navigation
            </p>
            <Dialog open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Open with Sidebar</Button>
              </DialogTrigger>
              <FixedSizeDialog>
                <FixedSizeDialogTitle>Project Settings</FixedSizeDialogTitle>
                <div className="flex flex-1 overflow-hidden">
                  <FixedSizeDialogSidebar title="Navigation" widthClassName="w-full sm:w-64">
                    <nav className="space-y-2">
                      <button
                        type="button"
                        className="w-full rounded-md bg-accent px-3 py-2 text-left text-sm font-medium text-accent-foreground"
                      >
                        General
                      </button>
                      <button
                        type="button"
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        Security
                      </button>
                      <button
                        type="button"
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        Integrations
                      </button>
                      <button
                        type="button"
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        Advanced
                      </button>
                    </nav>
                    <div className="mt-6 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Notice how the sidebar title aligns perfectly with the main dialog title.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The sidebar width is customizable via the widthClassName prop.
                      </p>
                    </div>
                  </FixedSizeDialogSidebar>
                  <FixedSizeDialogContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-foreground">
                          General Settings
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Configure your project's basic settings and preferences.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-foreground">
                            Project Name
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            placeholder="My Awesome Project"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-foreground">
                            Description
                          </label>
                          <textarea
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            rows={4}
                            placeholder="Enter project description..."
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-foreground">
                            Project Type
                          </label>
                          <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                            <option>Web Application</option>
                            <option>Mobile App</option>
                            <option>API Service</option>
                            <option>Library</option>
                          </select>
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">
                          This content demonstrates how the sidebar and main content work together.
                          Both areas are independently scrollable, and the sidebar title aligns with
                          the main dialog title.
                        </p>
                      </div>
                    </div>
                  </FixedSizeDialogContent>
                </div>
                <FixedSizeDialogActions>
                  <Button variant="outline" onClick={() => setIsSidebarOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsSidebarOpen(false)}>Save Changes</Button>
                </FixedSizeDialogActions>
              </FixedSizeDialog>
            </Dialog>
          </div>
        </div>

        {/* Feature List */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Component Features</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-foreground">✓</span>
              <span>Fixed large size on desktop (1200px max-width), fullscreen on mobile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">✓</span>
              <span>Fixed header (title) and footer (actions) via flexbox layout</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">✓</span>
              <span>Scrollable content area that grows to fill available space</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">✓</span>
              <span>Optional sidebar with customizable width</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">✓</span>
              <span>Sidebar title aligns perfectly with main dialog title</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">✓</span>
              <span>Accessibility-compliant with optional description component</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">✓</span>
              <span>Dark mode compatible with semantic color tokens</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">✓</span>
              <span>Composition-based API for maximum flexibility</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
