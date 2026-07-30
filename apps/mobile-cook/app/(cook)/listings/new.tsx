import { useRouter } from 'expo-router';
import { CookListingWizardScreen } from '../../../components/CookListingWizardScreen';

export default function NewListingScreen() {
  const router = useRouter();
  return <CookListingWizardScreen editingId={null} onExit={() => router.back()} />;
}
