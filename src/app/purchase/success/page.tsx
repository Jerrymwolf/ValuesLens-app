'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, Check, ArrowRight } from 'lucide-react';
import { useAssessmentStore } from '@/stores/assessmentStore';

function PurchaseSuccessContent() {
  const router = useRouter();
  const { rankedValues, definitions, sessionId } = useAssessmentStore();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Redirect if no session
  useEffect(() => {
    if (!sessionId || rankedValues.length === 0) {
      router.replace('/');
    }
  }, [sessionId, rankedValues.length, router]);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch('/api/pdf/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankedValues,
          definitions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ValuesLens-2026-Report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloaded(true);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!sessionId || rankedValues.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-500 rounded-full mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-brand-900 mb-2">
            Thank You!
          </h1>
          <p className="text-gray-600">
            Your 2026 Values Report is ready for download
          </p>
        </motion.div>

        {/* Download card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="text-center mb-6">
            <span className="text-4xl">📋</span>
            <h2 className="text-xl font-bold text-brand-900 mt-2">
              Your 2026 Values Report
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              PDF • All 5 values • Decision framework • Wallet card
            </p>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`w-full py-4 font-semibold rounded-full text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
              downloaded
                ? 'bg-accent-500 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-xl transform hover:-translate-y-0.5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isDownloading ? (
              <>
                <span className="animate-spin">⏳</span>
                Generating PDF...
              </>
            ) : downloaded ? (
              <>
                <Check size={20} />
                Downloaded!
              </>
            ) : (
              <>
                <Download size={20} />
                Download Your Report
              </>
            )}
          </button>

          {downloaded && (
            <p className="text-center text-sm text-gray-500 mt-3">
              You can download this report again anytime from this page
            </p>
          )}
        </motion.div>

        {/* What's included */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h3 className="font-bold text-brand-900 mb-4">What&apos;s Included:</h3>
          <ul className="space-y-3">
            {[
              'Full definitions for all 5 of your core values',
              'Personal decision framework based on your #1 value',
              'Beautifully designed, printable PDF report',
              'Wallet-sized values card to keep with you',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-600">
                <span className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-accent-600" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button
            onClick={() => router.push('/assess/share')}
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            Continue to share your values
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  );
}
