'use client';

interface SEOScoreGaugeProps {
    score: number;
    color: string;
}

export function SEOScoreGauge({ score, color }: SEOScoreGaugeProps) {
    // Create a semi-circle gauge (arc at top, opening at bottom)
    const radius = 60;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * Math.PI; // Half circle
    const progress = (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center py-4">
            <svg
                height={radius + 15}
                width={radius * 2}
                style={{ overflow: 'visible' }}
            >
                {/* Background arc - draws from left to right over the top */}
                <path
                    d={`M ${strokeWidth / 2} ${radius + 5} 
                        A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius + 5}`}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Foreground arc - progress indicator */}
                <path
                    d={`M ${strokeWidth / 2} ${radius + 5} 
                        A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius + 5}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    className="transition-all duration-500"
                />
            </svg>
            <div className="text-center -mt-10">
                <span className="text-3xl font-bold" style={{ color }}>
                    {score}
                </span>
                <span className="text-lg text-gray-500">/100</span>
            </div>
        </div>
    );
}
