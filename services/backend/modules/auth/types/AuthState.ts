import type { Doc } from '../../../convex/_generated/dataModel';

export type AuthState =
  | {
      sessionId: string;
      state: 'unauthenticated';
      reason: string;
    }
  | {
      sessionId: string;
      state: 'authenticated';
      user: Doc<'users'>;
    };

// Google-specific user profile type for frontend components
export type GoogleUserProfile = {
  name: string;
  email: string;
  picture?: string;
  googleProfile: {
    id: string;
    email: string;
    verified_email?: boolean;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    locale?: string;
    hd?: string;
  };
};
