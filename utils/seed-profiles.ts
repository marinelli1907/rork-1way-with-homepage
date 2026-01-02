import { FAKE_PROFILES } from '@/constants/fake-profiles';
import { UserProfile, ContactSource } from '@/types';

export async function seedFakeProfiles(
  createProfile: (profileData: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<UserProfile>,
  addConnection: (profileId: string, source: ContactSource) => Promise<void>,
  myProfileId: string | undefined
): Promise<void> {
  if (!myProfileId) {
    throw new Error('No profile to connect to');
  }

  const createdProfiles: UserProfile[] = [];

  for (const fakeProfile of FAKE_PROFILES) {
    const profile = await createProfile(fakeProfile);
    createdProfiles.push(profile);
  }

  for (const profile of createdProfiles) {
    await addConnection(profile.id, 'phone');
  }

  console.log(`Successfully seeded ${createdProfiles.length} profiles and connected them`);
}
