import { Redirect } from 'expo-router';

import { useSession } from '../src/providers/AppProviders';

export default function IndexScreen() {
  const { session } = useSession();
  return <Redirect href={session ? '/(app)' : '/login'} />;
}
