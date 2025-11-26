'use client'
import React, { useState } from 'react';
import { ChevronDown, ArrowUpRight, Pin, Map as MapIcon, Table } from 'lucide-react';

// Sidebar Data
const sidebarData = [
  { name: 'Maleria', cases: 235, trend: 18, color: '#ef4444' },
  { name: 'Typhoid', cases: 25, trend: 18, color: '#ef4444' },
  { name: 'Syphilis', cases: 46, trend: 10, color: '#ef4444' },
  { name: 'Dog Bite', cases: 6, trend: 18, color: '#ef4444' },
  { name: 'Snake Bite', cases: 347, trend: 12, color: '#ef4444' },
  { name: 'Rabies', cases: 300, trend: 10, color: '#ef4444' },
  { name: 'Yellow Fever', cases: 8, trend: 18, color: '#ef4444' },
  { name: 'Menigitis', cases: 40, trend: 18, color: '#ef4444' },
];

// Simple Sparkline Component
const Sparkline = () => (
  <svg width="60" height="20" viewBox="0 0 60 20" className="opacity-70">
    <path
      d="M0 15 Q10 18 20 10 T40 12 T60 5"
      fill="none"
      stroke="#ef4444"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M60 5 L55 5 L60 10 Z" fill="#ef4444" />
  </svg>
);

// Custom Map Component to replace React-Leaflet
const CustomMap = () => {
  // Generate random heatmap points
  const points = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    top: Math.random() * 80 + 10 + '%',
    left: Math.random() * 80 + 10 + '%',
    size: Math.random() * 60 + 40, // size in px
    opacity: Math.random() * 0.4 + 0.3,
    color: Math.random() > 0.7 ? 'bg-red-500' : Math.random() > 0.4 ? 'bg-yellow-400' : 'bg-green-500'
  }));

  return (
    <div className="w-full h-full bg-[#e5e7eb] relative overflow-hidden group">
      {/* Mock Map Background - Roads/Rivers */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <path d="M-100 200 Q 300 150 600 300 T 1200 200" fill="none" stroke="white" strokeWidth="15" />
        <path d="M200 -100 Q 250 300 100 800" fill="none" stroke="white" strokeWidth="12" />
        <path d="M600 -100 Q 550 400 900 900" fill="none" stroke="white" strokeWidth="12" />
        <path d="M0 500 L 1000 450" fill="none" stroke="white" strokeWidth="8" />
        <path d="M800 0 L 700 800" fill="none" stroke="white" strokeWidth="8" />
      </svg>
      
      {/* Map Labels */}
      <div className="absolute top-1/4 left-1/4 text-gray-400 font-bold text-xs tracking-widest uppercase">North District</div>
      <div className="absolute bottom-1/3 right-1/4 text-gray-400 font-bold text-xs tracking-widest uppercase">Central Hub</div>

      {/* Heatmap Points */}
      {points.map((point) => (
        <div
          key={point.id}
          className={`absolute rounded-full blur-xl ${point.color}`}
          style={{
            top: point.top,
            left: point.left,
            width: `${point.size}px`,
            height: `${point.size}px`,
            opacity: point.opacity,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Interactive Tooltip Simulation */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <div className="bg-white px-3 py-1 rounded shadow-md text-xs font-semibold text-gray-700">
          Viewing Region Data
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedPeriod, setSelectedPeriod] = useState('Day');

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="flex-none bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-4 shadow-sm z-20 relative">
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-between px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold min-w-[160px] hover:bg-indigo-100 transition-colors">
            <span>Wouri District</span>
          </button>
          
          <button className="flex items-center justify-between px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold min-w-[160px] hover:bg-indigo-100 transition-colors">
            <span>Health Area 01</span>
          </button>
        </div>

        {/* Time Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['Year', 'Month', 'Week', 'Day'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                selectedPeriod === period
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Number/Day Strip */}
        <div className="flex items-end gap-1">
          {/* Labels M, T, T above specific numbers */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-gray-500">M</span>
            <div className="w-8 h-8 flex items-center justify-center bg-amber-400 text-white font-bold rounded shadow-sm">1</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-gray-500">T</span>
            <div className="w-8 h-8 flex items-center justify-center bg-green-700 text-white font-bold rounded shadow-sm">2</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-gray-500">T</span>
            <div className="w-8 h-8 flex items-center justify-center bg-green-700 text-white font-bold rounded shadow-sm">3</div>
          </div>
          
          <div className="w-8 h-8 flex items-center justify-center bg-green-700 text-white font-bold rounded shadow-sm border-b-4 border-blue-600">4</div>
          <div className="w-8 h-8 flex items-center justify-center bg-green-700 text-white font-bold rounded shadow-sm">5</div>
          <div className="w-8 h-8 flex items-center justify-center bg-amber-400 text-white font-bold rounded shadow-sm">6</div>
          <div className="w-8 h-8 flex items-center justify-center bg-red-600 text-white font-bold rounded shadow-sm">7</div>
          <div className="w-8 h-8 flex items-center justify-center bg-amber-400 text-white font-bold rounded shadow-sm">8</div>
          <div className="w-8 h-8 flex items-center justify-center bg-green-700 text-white font-bold rounded shadow-sm">9</div>
          <div className="w-8 h-8 flex items-center justify-center bg-green-700 text-white font-bold rounded shadow-sm">10</div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-80 bg-white flex-none flex flex-col overflow-y-auto border-r border-gray-200 shadow-lg z-10">
          {sidebarData.map((item, index) => (
            <div 
              key={index} 
              className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">{item.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{String(item.cases).padStart(2, '0')} Cases</p>
                </div>
                <div className="pt-1">
                  <Sparkline />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-1 text-xs font-medium text-red-500">
                <ArrowUpRight size={14} />
                <span>{item.trend}% from last week</span>
              </div>
            </div>
          ))}
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-gray-200">
          <CustomMap />

          {/* Floating Table View Button */}
          <div className="absolute bottom-6 right-6 z-50">
            <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all border border-gray-200">
              <Table size={18} />
              <span>Table view</span>
              <Pin size={14} className="ml-2 text-blue-600 fill-blue-600 rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}