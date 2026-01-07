'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STEPS = [
  { path: '/assess/sort', label: 'Sort', step: 1 },
  { path: '/assess/select', label: 'Select', step: 2 },
  { path: '/assess/story', label: 'Story', step: 3 },
  { path: '/assess/goals', label: 'Goals', step: 4 },
  { path: '/assess/share', label: 'Share', step: 5 },
];

export default function AssessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStartPage = pathname === '/assess/start';

  // Find current step
  const currentStep = STEPS.find((s) => pathname.startsWith(s.path))?.step ?? 1;
  const progress = (currentStep / STEPS.length) * 100;

  // Warn before leaving during assessment (not on start page)
  useEffect(() => {
    if (isStartPage) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStartPage]);

  // Start page has its own layout - bypass wrapper
  if (isStartPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 to-white">
      {/* Header with progress */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step) => (
              <div
                key={step.path}
                className={`flex items-center gap-2 text-sm ${
                  step.step === currentStep
                    ? 'text-brand-600 font-medium'
                    : step.step < currentStep
                    ? 'text-accent-600'
                    : 'text-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    step.step === currentStep
                      ? 'bg-brand-600 text-white ring-2 ring-brand-100'
                      : step.step < currentStep
                      ? 'bg-accent-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.step < currentStep ? '✓' : step.step}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-prism transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
