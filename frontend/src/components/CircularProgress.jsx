import { motion } from 'framer-motion';

const CircularProgress = ({
    percentage,
    size = 120,
    strokeWidth = 8,
    color = '#4CAF50',
    warningColor = '#FFC107',
    dangerColor = '#F44336',
    showPercentage = true
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    // Determine color based on percentage
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

export default CircularProgress;
