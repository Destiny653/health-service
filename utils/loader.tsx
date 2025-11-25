import React from 'react';

export default function HealthFacilityLoader() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex flex-col items-center space-y-8 p-8  ">

                {/* ECG Monitor Style Loader (Dark Screen) */}
                <div className="relative w-80 h-48">

                    {/* ECG Heartbeat Line Animation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            className="w-full h-32"
                            viewBox="0 0 800 200"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Animated ECG Wave - Classic QRS complex pattern (Main Trace) */}
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

                            {/* Glow effect (slightly thicker, blurred trace) */}
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
                                opacity="0.4"
                                className="animate-ecg-pulse blur-sm"
                            />
                        </svg>
                    </div>

                    {/* Heart rate label */}
                    <div className="absolute top-4 left-6 text-green-400 text-sm font-mono tracking-wider">
                        HR 78 bpm
                    </div>

                    {/* Green power indicator dot */}
                    <div className="absolute top-4 right-6 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                </div>

                {/* Loading text */}
                <div className="text-center">
                    <p className="text-gray-700 text-xl font-medium tracking-tight">
                        Loading vital data...
                    </p>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs">
                        Establishing secure connection with the health network. Thank you for your patience.
                    </p>
                </div>
            </div>

            {/* Tailwind animation for the ECG line */}
            <style jsx>{`
                @keyframes ecg-pulse {
                    0% {
                        /* Start fully offset to the left */
                        stroke-dashoffset: 800;
                    }
                    100% {
                        /* Move trace to the right, simulating sweep */
                        stroke-dashoffset: -800;
                    }
                }

                .animate-ecg-pulse {
                    /* Total length of the path for dash array */
                    stroke-dasharray: 800; 
                    animation: ecg-pulse 3s linear infinite; /* Faster, more urgent pulse */
                }
            `}</style>
        </div>
    );
}