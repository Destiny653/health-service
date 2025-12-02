"use client";

import React, { useMemo, useState } from "react";
import { GoogleMap, useJsApiLoader, HeatmapLayer } from "@react-google-maps/api";
import { TrendingUp } from "lucide-react";
import { Card } from "../ui/card";
import { useGetFacilities } from "@/components/facility/hooks/useFacility";
import { useGetCasesStats, CasesStatsResponse } from "@/hooks/docs/useGetStatistics";

const mapContainerStyle = { width: "100%", height: "100%" };
const center = { lat: 4.0511, lng: 9.7679 }; // Default to Douala/Wouri area
const libraries: ("visualization")[] = ["visualization"];

// ID from user request, assumed to be Wouri District or similar parent
const PARENT_FACILITY_ID = "69207e34d5291f6e10b4a5d9";

export default function AreaStatusContent() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
    const [timeGranularity, setTimeGranularity] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries,
    });

    // Fetch Facilities for Dropdown
    const { data: facilitiesData, isLoading: isLoadingFacilities } = useGetFacilities(PARENT_FACILITY_ID);

    // Fetch Cases Statistics
    const { data: casesStats, isLoading: isLoadingStats } = useGetCasesStats({
        facility_id: PARENT_FACILITY_ID,
        granularity: timeGranularity,
        child_facility_id: selectedFacilityId || undefined
    });

    // Process Cases Data for Sidebar
    const processedStats = useMemo(() => {
        if (!casesStats) return [];
        
        // casesStats is an array of objects: [{ "DiseaseName": { ... } }, ...]
        return casesStats.map(item => {
            const diseaseName = Object.keys(item)[0];
            const data = item[diseaseName];
            // Calculate trend if available, otherwise 0
            // Note: API response shown doesn't have explicit trend percentage, 
            // so we might need to calculate it from time_stats or use 0 for now.
            return {
                name: diseaseName,
                cases: data.total_cases,
                trend: 0, // Placeholder as trend isn't in the immediate snippet
                facilityData: data.facility
            };
        });
    }, [casesStats]);

    // Process Heatmap Data
    const heatmapData = useMemo(() => {
        if (!isLoaded || !window.google || !casesStats) return [];

        const points: google.maps.LatLng[] = [];

        casesStats.forEach(item => {
            const diseaseName = Object.keys(item)[0];
            const diseaseData = item[diseaseName];
            
            Object.values(diseaseData.facility).forEach(facility => {
                const { latitude, longitude } = facility.info;
                // Check if lat/lng exist and are valid numbers
                if (latitude && longitude) {
                    // Add points based on total_cases weight
                    // For heatmap, we can add the point multiple times or use weighted location if supported by library wrapper
                    // The wrapper supports weighted locations but the simple array<LatLng> is easier if we just flatten
                    // However, creating 1000 points for 1000 cases might be heavy.
                    // Let's try to use WeightedLocation if possible, or just 1 point per case up to a limit.
                    // For now, let's just add one point per facility with cases, 
                    // or if we want to show intensity, we might need to use the 'weight' property of HeatmapLayer data.
                    // But the react-google-maps-api HeatmapLayer accepts MVCArray<LatLng | WeightedLocation>
                    
                    // Let's use WeightedLocation for better performance
                    points.push({
                        location: new google.maps.LatLng(latitude, longitude),
                        weight: facility.total_cases
                    } as any); 
                }
            });
        });

        return points;
    }, [isLoaded, casesStats]);

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* Top Header Bar */}
            <div className="bg-white px-6 py-6 flex items-center gap-3">
                <div className="px-4 py-2 bg-blue-50 rounded border border-blue-300">
                    <span className="text-blue-700 font-semibold text-sm">Wouri District</span>
                </div>
                <div className="relative">
                    <select 
                        className="px-4 py-2 bg-blue-50 rounded border border-blue-300 text-blue-700 font-semibold text-sm appearance-none pr-8 cursor-pointer"
                        value={selectedFacilityId}
                        onChange={(e) => setSelectedFacilityId(e.target.value)}
                        disabled={isLoadingFacilities}
                    >
                        <option value="">All Health Areas</option>
                        {facilitiesData?.results?.map((facility) => (
                            <option key={facility._id} value={facility._id}>
                                {facility.name}
                            </option>
                        ))}
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {/* Time Granularity Buttons - Moved to Left */}
                <div className="flex items-center border bg-gray-100 rounded overflow-hidden ml-4">
                    {(["yearly", "monthly", "weekly", "daily"] as const).map((item) => (
                        <button
                            key={item}
                            onClick={() => setTimeGranularity(item)}
                            className={`px-4 py- h-10 text-sm font-medium border-r border-gray-300 last:border-r-0 capitalize ${
                                timeGranularity === item 
                                    ? "text-white bg-green-600 hover:bg-green-700" 
                                    : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {/* Date Strip */}
                    <div className="flex items-center gap-1">
                        {[
                            { day: "M", num: 1, color: "bg-yellow-400" },
                            { day: "T", num: 2, color: "bg-green-600" },
                            { day: "T", num: 3, color: "bg-green-600" },
                            { day: "T", num: 4, color: "bg-green-600", active: true },
                            { day: "F", num: 5, color: "bg-green-700" },
                            { day: "S", num: 6, color: "bg-yellow-400" },
                            { day: "S", num: 7, color: "bg-red-600" },
                            { day: "M", num: 8, color: "bg-yellow-400" },
                            { day: "T", num: 9, color: "bg-green-600" },
                            { num: 10, color: "bg-gray-400" },
                        ].map((d) => (
                            <div
                                key={d.num}
                                className="flex flex-col items-center justify-end"
                                style={{ minWidth: '28px' }}
                            >
                                {d.day && <span className="text-[10px] font-semibold text-gray-600 mb-1 h-3 flex items-center">{d.day}</span>}
                                {!d.day && <div className="h-3 mb-1"></div>}
                                <button
                                    className={`w-7 h-7 rounded text-white font-bold text-lg flex items-center justify-center p-6 transition-all ${d.active ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                        } ${d.color}`}
                                >
                                    {d.num}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Main Content: Sidebar + Map */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingStats ? (
                            <div className="p-5 text-center text-gray-500">Loading statistics...</div>
                        ) : processedStats.length === 0 ? (
                            <div className="p-5 text-center text-gray-500">No data available</div>
                        ) : (
                            processedStats.map((disease, i) => (
                                <div
                                    key={i}
                                    className="px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-900">{disease.name}</h3>
                                        <svg width="60" height="30" viewBox="0 0 60 30" className="text-orange-300">
                                            <path
                                                d="M0 25 L10 18 L20 22 L30 12 L40 16 L50 10 L60 14"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-900 font-bold">{disease.cases} Cases</span>
                                        <div className="flex items-center text-red-600 text-xs font-medium">
                                            <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                            {disease.trend}% from Last week
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Map Container */}
                <Card className="flex-1 relative bg-gray-100 shadow-inner">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={center}
                            zoom={10}
                            options={{
                                zoomControl: true,
                                zoomControlOptions: { position: 7 }, // RIGHT_CENTER
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: false,
                            }}
                        >
                            <HeatmapLayer
                                data={heatmapData}
                                options={{
                                    radius: 40,
                                    opacity: 0.85,
                                    dissipating: true,
                                    gradient: [
                                        "rgba(0, 255, 255, 0)",
                                        "rgba(0, 255, 255, 1)",
                                        "rgba(0, 191, 255, 1)",
                                        "rgba(0, 127, 255, 1)",
                                        "rgba(0, 63, 255, 1)",
                                        "rgba(0, 0, 255, 1)",
                                        "rgba(0, 0, 223, 1)",
                                        "rgba(0, 0, 191, 1)",
                                        "rgba(0, 0, 159, 1)",
                                        "rgba(0, 0, 127, 1)",
                                        "rgba(63, 0, 91, 1)",
                                        "rgba(127, 0, 63, 1)",
                                        "rgba(191, 0, 31, 1)",
                                        "rgba(255, 0, 0, 1)",
                                    ],
                                }}
                            />
                        </GoogleMap>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-200">
                            <p className="text-gray-600">Loading map...</p>
                        </div>
                    )}

                    {/* Table View Button */}
                    <div className="absolute bottom-4 right-16 z-10">
                        <button className="bg-white px-5 py-3  rounded-lg shadow-lg border border-gray-300 font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition">
                            Table view
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-blue-600"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="18"></line>
                                <line x1="9" y1="14" x2="15" y2="14"></line>
                                <line x1="9" y1="10" x2="15" y2="10"></line>
                            </svg>
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}