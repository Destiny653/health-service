export default function HealthFacilityLoader() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex flex-col items-center space-y-8">

                {/* ECG Monitor Style Loader */}
                <div className="relative w-80 h-48 bg-inherit rounded-lg overflow-hidden">

                    {/* Screen grid (subtle medical monitor feel) */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="h-full w-full bg-grid-green-500/10"
                            style={{
                                backgroundImage: `linear-gradient(green 1px, transparent 1px), linear-gradient(90deg, green 1px, transparent 1px)`,
                                backgroundSize: '20px 20px'
                            }} />
                    </div>

                    {/* ECG Heartbeat Line Animation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            className="w-full h-32"
                            viewBox="0 0 800 200"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Baseline */}
                            <line x1="0" y1="100" x2="800" y2="100" stroke="#166534" strokeWidth="2" />

                            {/* Animated ECG Wave - Classic QRS complex pattern */}
                            <path
                                d="M 0 100 
                   L 100 100 
                   L 120 100 
                   L 135 50 
                   L 140 180 
                   L 150 80 
                   L 160 100 
                   L 300 100 
                   L 320 100 
                   L 335 50 
                   L 340 180 
                   L 350 80 
                   L 360 100 
                   L 500 100 
                   L 520 100 
                   L 535 50 
                   L 540 180 
                   L 550 80 
                   L 560 100 
                   L 700 100 
                   L 720 100 
                   L 735 50 
                   L 740 180 
                   L 750 80 
                   L 760 100 
                   L 800 100"
                                stroke="#22c55e"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                className="animate-ecg-pulse"
                            />

                            {/* Glow effect */}
                            <path
                                d="M 0 100 
                   L 100 100 
                   L 120 100 
                   L 135 50 
                   L 140 180 
                   L 150 80 
                   L 160 100 
                   L 300 100 
                   L 320 100 
                   L 335 50 
                   L 340 180 
                   L 350 80 
                   L 360 100 
                   L 500 100 
                   L 520 100 
                   L 535 50 
                   L 540 180 
                   L 550 80 
                   L 560 100 
                   L 700 100 
                   L 720 100 
                   L 735 50 
                   L 740 180 
                   L 750 80 
                   L 760 100 
                   L 800 100"
                                stroke="#86efac"
                                strokeWidth="6"
                                strokeLinecap="round"
                                fill="none"
                                opacity="0.6"
                                className="animate-ecg-pulse blur-sm"
                            />
                        </svg>
                    </div>

                    {/* Heart rate label (optional, professional touch) */}
                    <div className="absolute top-4 left-6 text-green-400 text-sm font-mono tracking-wider">
                        HR 78 bpm
                    </div>

                    {/* Green power indicator dot */}
                    <div className="absolute top-4 right-6 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                </div>

                {/* Loading text */}
                <div className="text-center">
                    <p className="text-gray-700 text-lg font-medium">
                        Loading your health profile...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Please wait while we retrieve your records securely
                    </p>
                </div>
            </div>

            {/* Tailwind animation for the ECG line */}
            <style jsx>{`
        @keyframes ecg-pulse {
          0% {
            stroke-dasharray: 0 1000;
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dasharray: 1000 0;
            stroke-dashoffset: -1000;
          }
        }

        .animate-ecg-pulse {
          animation: ecg-pulse 5s linear infinite;
          stroke-dasharray: 1000;
          stroke-dashoffset: 0;
        }
      `}</style>
        </div>
    );
}