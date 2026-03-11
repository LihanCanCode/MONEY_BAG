/**
 * @fileoverview Loading Skeleton Components
 * 
 * Provides skeleton loading placeholders for better UX during data fetching.
 * Uses CSS pulse animations matching the dark theme design system.
 * 
 * Components:
 * - DashboardSkeleton: Full dashboard loading state with pulsing icon
 * - CardSkeleton: Reusable single card skeleton for individual components
 */

import React from 'react';
import { FaDollarSign } from 'react-icons/fa';

/**
 * DashboardSkeleton Component
 * 
 * Displays a centered pulsing loading indicator matching the dark theme.
 * 
 * @returns {JSX.Element} Full dashboard loading skeleton
 */
const DashboardSkeleton = () => {
    return (
        <div className="dash-skeleton">
            <div className="dash-skeleton-inner">
                <FaDollarSign className="dash-skeleton-icon" />
                <p className="dash-skeleton-text">Loading your dashboard...</p>
            </div>

            <style>{`
                .dash-skeleton {
                    min-height: 100vh;
                    background: #0B0F1A;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dash-skeleton-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }

                .dash-skeleton-icon {
                    font-size: 3rem;
                    color: #10B981;
                    animation: skeletonPulse 1.5s ease-in-out infinite;
                }

                .dash-skeleton-text {
                    color: #9CA3AF;
                    font-size: 1rem;
                    font-weight: 500;
                }

                @keyframes skeletonPulse {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.15); }
                }
            `}</style>
        </div>
    );
};

/**
 * CardSkeleton - Reusable skeleton for individual cards
 */
export const CardSkeleton = () => {
    return (
        <div className="card-skeleton">
            <div className="card-skeleton-bar title-bar"></div>
            <div className="card-skeleton-bar"></div>
            <div className="card-skeleton-bar"></div>
            <div className="card-skeleton-bar short-bar"></div>

            <style>{`
                .card-skeleton {
                    background: #1E293B;
                    border-radius: 16px;
                    padding: 1.5rem;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .card-skeleton-bar {
                    height: 14px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 6px;
                    margin-bottom: 0.75rem;
                    animation: skeletonShimmer 1.5s ease-in-out infinite;
                }

                .card-skeleton-bar.title-bar {
                    width: 60%;
                    height: 20px;
                    margin-bottom: 1.25rem;
                }

                .card-skeleton-bar.short-bar {
                    width: 40%;
                    margin-bottom: 0;
                }

                @keyframes skeletonShimmer {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default DashboardSkeleton;
