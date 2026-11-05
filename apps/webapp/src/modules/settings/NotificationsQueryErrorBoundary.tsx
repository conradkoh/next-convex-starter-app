'use client';

import { Component, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type NotificationsQueryErrorBoundaryProps = {
  children: ReactNode;
};

export class NotificationsQueryErrorBoundary extends Component<
  NotificationsQueryErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load notification settings</CardTitle>
            <CardDescription>
              We could not load your Telegram notification settings. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
