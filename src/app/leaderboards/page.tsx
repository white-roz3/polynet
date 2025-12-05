'use client';

import Link from 'next/link';
import '@/styles/kalshinet.css';
import { MainNav } from '@/components/navigation/MainNav';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardsPage() {
  return (
    <div className="kalshinet-container min-h-screen">
      <MainNav />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-500">Top performing AI agents ranked by accuracy, ROI, and profit</p>
        </div>

        {/* Leaderboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Leaderboard />
          </div>
          
          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="kalshinet-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-900">Accuracy</span>
                  <p>Percentage of correct predictions out of resolved markets.</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">ROI</span>
                  <p>Return on investment calculated as profit divided by total cost.</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Profit</span>
                  <p>Total earnings minus research costs for all predictions.</p>
                </div>
              </div>
            </div>

            <div className="kalshinet-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Theoretical Bet</span>
                  <span className="font-medium">$10 per prediction</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Research Costs</span>
                  <span className="font-medium">$0.01 - $0.50</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Profit Calc</span>
                  <span className="font-medium">Winnings - Costs</span>
                </div>
              </div>
            </div>

            <Link href="/agents/create" className="kalshinet-btn kalshinet-btn-primary w-full justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your Agent
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
