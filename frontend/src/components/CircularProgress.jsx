/**
 * @fileoverview Circular Progress Indicator Component
 *
 * Renders an SVG-based circular progress ring with:
 *  - Animated stroke transition from 0 → target percentage
 *  - Color-coded thresholds (green → yellow → red) for budget status
 *  - Optional centered percentage text label
 *  - Configurable size, stroke width, and colors
 *
 * @module components/CircularProgress
 */
import { motion } from 'framer-motion';

/**
 * CircularProgress Component
 *
 * @param {Object}  props
 * @param {number}  props.percentage    - Progress value (0–100+; capped visually at 100)
 * @param {number}  [props.size=120]    - Diameter of the SVG in pixels
 * @param {number}  [props.strokeWidth=8] - Width of the progress ring stroke
 * @param {string}  [props.color='#4CAF50']        - Default (good) color
 * @param {string}  [props.warningColor='#FFC107']  - Color when percentage ≥ 80%
 * @param {string}  [props.dangerColor='#F44336']   - Color when percentage ≥ 100%
 * @param {boolean} [props.showPercentage=true]     - Whether to show the % label in center
 * @returns {JSX.Element}
 */
const CircularProgress = ({
    percentage,
    size = 120,
    strokeWidth = 8,
    color = '#4CAF50',
    warningColor = '#FFC107',
    dangerColor = '#F44336',
    showPercentage = true
}) => {
    // ── SVG Circle Math ──────────────────────────────────────────────
    const radius = (size - strokeWidth) / 2;                   // Inner radius
    const circumference = radius * 2 * Math.PI;                 // Full circle length
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference; // Unfilled portion

    /**
     * Determine ring color based on percentage thresholds:
     *  ≥ 100% → danger (red)   – over budget
     *  ≥  80% → warning (yellow) – approaching limit
     *  <  80% → default (green) – on track
     */
    const getColor = () => {
        if (percentage >= 100) return dangerColor;
        if (percentage >= 80) return warningColor;
        return color;
    };

    const currentColor = getColor();

    return (
        <div className="circular-progress" style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                />

                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={currentColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />
            </svg>

            {showPercentage && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: size / 5,
                        fontWeight: 'bold',
                        color: currentColor,
                    }}
                >
                    {Math.round(percentage)}%
                </div>
            )}
        </div>
    );
};

/* Export the CircularProgress component as the default module export */
export default CircularProgress;
