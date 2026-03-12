import type { UserProfile } from '../types';

const PROFILE_KEY = 'openapply_profile';
const DEFAULT_COMPANION = 'http://localhost:7523';

export const defaultProfile: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  workAuthorization: 'Student Visa',
  requireSponsorship: false,
  salaryExpectation: '',
  llmProvider: 'gemini',
  companionUrl: DEFAULT_COMPANION,
};

export async function getProfile(): Promise<UserProfile> {
  return new Promise((resolve) => {
    chrome.storage.local.get(PROFILE_KEY, (result) => {
      resolve({ ...defaultProfile, ...(result[PROFILE_KEY] || {}) });
    });
  });
}

export async function saveProfile(profile: Partial<UserProfile>): Promise<void> {
  const current = await getProfile();
  return new Promise((resolve) => {
    chrome.storage.local.set({ [PROFILE_KEY]: { ...current, ...profile } }, resolve);
  });
}
