import { PatchworkProvider, usePatchwork } from '@/context/PatchworkContext';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { PatchList } from '@/components/PatchList';
import { PatchDetail } from '@/components/PatchDetail';
import { PreviewPanel } from '@/components/PreviewPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AuditLog } from '@/components/AuditLog';
import { SampleWebsite } from '@/components/SampleWebsite';

function MainContent() {
  const { view, selectedPatch } = usePatchwork();

  switch (view) {
    case 'dashboard':
      return <Dashboard />;
    case 'patches':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <PatchList />
          </div>
          <div className="space-y-4">
            {selectedPatch ? (
              <PatchDetail patch={selectedPatch} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">
                  Select a patch to see its details, verification results, and actions.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    case 'preview':
      return <PreviewPanel />;
    case 'history':
      return <HistoryPanel />;
    case 'audit':
      return <AuditLog />;
    default:
      return <Dashboard />;
  }
}

function AppShell() {
  const { view } = usePatchwork();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Top header */}
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 capitalize">
                  {view === 'dashboard' ? 'Dashboard' : view}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {view === 'dashboard' && 'Overview of patches, versions, and recent activity'}
                  {view === 'patches' && 'Create, verify, approve, and deploy patches'}
                  {view === 'preview' && 'Preview patches and versions without affecting the active website'}
                  {view === 'history' && 'Version history with snapshot-based rollback'}
                  {view === 'audit' && 'Complete audit trail of all events'}
                </p>
              </div>
            </div>
          </div>

          <MainContent />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <PatchworkProvider>
      <AppShell />
    </PatchworkProvider>
  );
}
