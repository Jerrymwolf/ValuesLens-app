'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Demographics {
  ageRange?: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  industry?: string;
  leadershipRole?: boolean;
  country?: string;
}

interface DemographicsFormProps {
  isOpen: boolean;
  onSubmit: (data: Demographics) => void;
  onSkip: () => void;
}

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const;

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Education',
  'Finance',
  'Manufacturing',
  'Retail',
  'Government',
  'Non-profit',
  'Consulting',
  'Legal',
  'Media',
  'Other',
];

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Brazil',
  'Japan',
  'Netherlands',
  'Spain',
  'Italy',
  'Mexico',
  'Singapore',
  'Sweden',
  'Switzerland',
  'South Africa',
  'New Zealand',
  'Ireland',
  'Other',
];

export default function DemographicsForm({ isOpen, onSubmit, onSkip }: DemographicsFormProps) {
  const [ageRange, setAgeRange] = useState<Demographics['ageRange']>();
  const [industry, setIndustry] = useState<string>();
  const [leadershipRole, setLeadershipRole] = useState<boolean>();
  const [country, setCountry] = useState<string>();

  const handleSubmit = () => {
    const data: Demographics = {};
    if (ageRange) data.ageRange = ageRange;
    if (industry) data.industry = industry;
    if (leadershipRole !== undefined) data.leadershipRole = leadershipRole;
    if (country) data.country = country;
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
        onClick={onSkip}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-brand-900">
                Help Improve ValuesLens
              </h2>
              <p className="text-sm text-gray-500 mt-1">Optional - all responses are anonymous</p>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-600 text-sm mb-6">
            This anonymous data helps us understand how values differ across demographics and improve the assessment.
          </p>

          {/* Age Range */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range
            </label>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => setAgeRange(range)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    ageRange === range
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={industry || ''}
              onChange={(e) => setIndustry(e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Select an industry...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Leadership Role */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do you manage or lead others?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setLeadershipRole(true)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm transition-all ${
                  leadershipRole === true
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setLeadershipRole(false)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm transition-all ${
                  leadershipRole === false
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Country */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={country || ''}
              onChange={(e) => setCountry(e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Select a country...</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors border border-gray-200 rounded-full"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all"
            >
              Submit
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
