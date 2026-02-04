/**
 * @fileoverview Loading Skeleton Components
 * 
 * Provides skeleton loading placeholders for better UX during data fetching.
 * Uses react-loading-skeleton library for smooth loading animations.
 * 
 * Components:
 * - DashboardSkeleton: Full dashboard loading state with multiple card placeholders
 * - CardSkeleton: Reusable single card skeleton for individual components
 */

import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * DashboardSkeleton Component
 * 
 * Displays comprehensive loading skeleton for the entire dashboard page.
 * Mimics the layout of the actual dashboard to provide visual continuity.
 * 
 * Includes skeletons for:
 * - Page header (title and subtitle)
 * - Wallet overview card with 3 stat columns
 * - 4 action buttons in a grid
 * 
 * @returns {JSX.Element} Full dashboard loading skeleton
 */
const DashboardSkeleton = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header Skeleton */}
                <div className="text-center mb-12">
                    <Skeleton height={48} width={400} className="mx-auto mb-3" />
                    <Skeleton height={24} width={300} className="mx-auto" />
                </div>

                {/* Wallet Overview Skeleton */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8">
                    <Skeleton height={32} width={250} className="mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-8 rounded-xl">
                                <Skeleton height={16} width={120} className="mb-2" />
                                <Skeleton height={40} width={150} className="mb-1" />
                                <Skeleton height={4} width={64} className="mt-3" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} height={80} className="rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * CardSkeleton - Reusable skeleton for individual cards
 */
export const CardSkeleton = () => {
    return (
        <div className="bg-white rounded-xl p-6 shadow-md">
            <Skeleton height={24} width="60%" className="mb-4" />
            <Skeleton height={16} count={3} className="mb-2" />
            <Skeleton height={40} className="mt-4" />
        </div>
    );
};

export default DashboardSkeleton;
