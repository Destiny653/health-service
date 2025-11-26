"use client";

import React, { useMemo } from "react";
import { GoogleMap, useJsApiLoader, HeatmapLayer } from "@react-google-maps/api";
import { TrendingUp } from "lucide-react";
import { Card } from "../ui/card";

interface DiseaseStat {
    name: string;
    cases: number;
    trend: number;
}

const diseaseStats: DiseaseStat[] = [
    { name: "Maleria", cases: 235, trend: 18 },
    { name: "Typhoid", cases: 25, trend: 18 },
    { name: "Syphilis", cases: 46, trend: 10 },
    { name: "Dog Bite", cases: 6, trend: 15 },
    { name: "Snake Bite", cases: 347, trend: 10 },
    { name: "Rabies", cases: 300, trend: 15 },
    { name: "Yellow Fever", cases: 8, trend: 19 },
    { name: "Menigitis", cases: 40, trend: 18 },
];

const rawHeatmapData = [
    { lat: 39.0906, lng: -77.1533, weight: 50 },
    { lat: 36.2072, lng: -77.0369, weight: 80 },
    { lat: 38.8951, lng: -77.0364, weight: 90 },
    { lat: 38.9697, lng: -77.0891, weight: 70 },
    { lat: 39.0469, lng: -77.1187, weight: 65 },
    { lat: 38.9847, lng: -77.0947, weight: 75 },
    { lat: 39.0042, lng: -77.0195, weight: 60 },
    { lat: 38.85, lng: -77.04, weight: 85 },
    { lat: 38.88, lng: -77.00, weight: 95 },
    { lat: 38.90, lng: -77.05, weight: 88 },
    { lat: 38.92, lng: -77.03, weight: 82 },
    { lat: 38.87, lng: -77.08, weight: 78 },
    { lat: 39.02, lng: -77.10, weight: 72 },
    { lat: 38.95, lng: -77.08, weight: 90 },
    { lat: 38.98, lng: -77.02, weight: 68 },
    { lat: 38.85, lng: -76.98, weight: 60 },
    { lat: 39.10, lng: -77.20, weight: 55 },
];

const mapContainerStyle = { width: "100%", height: "100%" };
const center = { lat: 38.9072, lng: -77.0369 }; // Washington DC area for realistic heatmap
const libraries: ("visualization")[] = ["visualization"];

export default function AreaStatusContent() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries,
    });

    const heatmapData = useMemo(() => {
        if (!isLoaded || !window.google) return [];

        return rawHeatmapData.flatMap((point) =>
            Array(point.weight)
                .fill(0)
                .map(() => new google.maps.LatLng(point.lat, point.lng))
        );
    }, [isLoaded]);

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* Top Header Bar */}
            <div className="bg-white px-6 py-6 flex items-center gap-3">
                <div className="px-4 py-2 bg-blue-50 rounded border border-blue-300">
                    <span className="text-blue-700 font-semibold text-sm">Wouri District</span>
                </div>
                <div className="relative">
                    <select className="px-4 py-2 bg-blue-50 rounded border border-blue-300 text-blue-700 font-semibold text-sm appearance-none pr-8 cursor-pointer">
                        <option>Health Area 01</option>
                        <option>Health Area 02</option>
                        <option>Health Area 03</option>
                        <option>Health Area 04</option>
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {/* Time Granularity Buttons - Moved to Left */}
                <div className="flex items-center border bg-gray-100 rounded overflow-hidden ml-4">
                    {["Year", "Month", "Week"].map((item) => (
                        <button
                            key={item}
                            className="px-4 py- h-10 text-sm font-medium text-gray-700  hover:bg-gray-50 border-r border-gray-300 last:border-r-0"
                        >
                            {item}
                        </button>
                    ))}
                    <button className="px-4 py- h-10 text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                        Day
                    </button>
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
                        {diseaseStats.map((disease, i) => (
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
                        ))}
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