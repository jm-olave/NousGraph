
import { Navigation } from '@/components/navigation';
import MedicalEDADashboard from '@/components/medical-eda-dashboard';

export default function EDAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-nous-cream to-white">
      <Navigation />
      <MedicalEDADashboard />
    </div>
  );
}