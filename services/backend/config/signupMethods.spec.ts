import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAllowedSignupMethods,
  isInviteSignupAllowed,
  isSelfSignupAllowed,
  isSignupAllowed,
  SignupMethod,
} from './signupMethods';

const mockAllowedSignupMethods = vi.hoisted(() => ({
  value: ['self'] as string[] | null,
}));

vi.mock('./featureFlags', () => ({
  featureFlags: {
    get allowedSignupMethods() {
      return mockAllowedSignupMethods.value;
    },
  },
}));

describe('getAllowedSignupMethods', () => {
  beforeEach(() => {
    mockAllowedSignupMethods.value = ['self'];
  });

  it('returns empty array when allowedSignupMethods is null', () => {
    mockAllowedSignupMethods.value = null;
    expect(getAllowedSignupMethods()).toEqual([]);
  });

  it('returns empty array when allowedSignupMethods is empty', () => {
    mockAllowedSignupMethods.value = [];
    expect(getAllowedSignupMethods()).toEqual([]);
  });

  it('returns self when configured with self', () => {
    mockAllowedSignupMethods.value = ['self'];
    expect(getAllowedSignupMethods()).toEqual([SignupMethod.Self]);
  });

  it('filters out unknown signup method values', () => {
    mockAllowedSignupMethods.value = ['self', 'waitlist', 'invite'];
    expect(getAllowedSignupMethods()).toEqual([SignupMethod.Self, SignupMethod.Invite]);
  });
});

describe('signup method helpers', () => {
  beforeEach(() => {
    mockAllowedSignupMethods.value = ['self'];
  });

  it('isSignupAllowed is false when no methods are configured', () => {
    mockAllowedSignupMethods.value = null;
    expect(isSignupAllowed()).toBe(false);
    mockAllowedSignupMethods.value = [];
    expect(isSignupAllowed()).toBe(false);
  });

  it('isSelfSignupAllowed is true when self is allowed', () => {
    mockAllowedSignupMethods.value = ['self'];
    expect(isSelfSignupAllowed()).toBe(true);
    expect(isInviteSignupAllowed()).toBe(false);
  });

  it('isInviteSignupAllowed is true when invite is allowed', () => {
    mockAllowedSignupMethods.value = ['invite'];
    expect(isInviteSignupAllowed()).toBe(true);
    expect(isSelfSignupAllowed()).toBe(false);
  });
});
