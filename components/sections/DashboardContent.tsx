"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BoxArrowDownIcon, DatabaseIcon } from '@phosphor-icons/react';
import GoogleMapViewer from '../team/GoogleMapViewer';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';

import { useGetChildFacilities } from '@/hooks/docs/useGetDoc';
import { useGetFacilityStats, useGetHealthCenterStats } from '@/hooks/docs/useGetStatistics';

// Get logged-in user from localStorage
const useUserData = (): any => {
  if (typeof window === 'undefined') return null;
  const userDataString = localStorage.getItem('userData');
  return userDataString ? JSON.parse(userDataString) : null;
};

// Icons (exactly as you use them)
const TrendUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const TrendDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);

const DashboardContent = () => {
  const user = useUserData();
  const userFacility = user?.facility;
  const userFacilityType = user?.facility_type;
  const userFacilityId = userFacility?.id;

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedHealthArea, setSelectedHealthArea] = useState<string>("");
  const [selectedHealthCenter, setSelectedHealthCenter] = useState<string>("");
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Fetch child facilities only if district or health_area
  const shouldFetchChildren = userFacilityType === "district" || userFacilityType === "health_area";
  const { data: childData } = useGetChildFacilities(shouldFetchChildren ? userFacilityId : undefined);
  const childFacilities = childData?.results || [];

  console.log(childFacilities)
  // Health Areas — only show if user is district
  const healthAreas = useMemo(() => {
    if (userFacilityType !== "district") return [];
    return childFacilities.filter((f: any) => f.facility_type === "health_area");
  }, [childFacilities, userFacilityType]);

  // Health Centers — show based on user type
  const healthCenters = useMemo(() => {
    if (userFacilityType === "district") {
      // District user: show health centers under selected health area
      if (!selectedHealthArea) return [];
      return childFacilities.filter((f: any) => f.parent_id === selectedHealthArea);
    }

    if (userFacilityType === "health_area") {
      // Health Area user: show their own child health centers
      return childFacilities.filter((f: any) => f.parent_id === userFacilityId);
    }

    // Health Center user: no dropdown needed
    return [];
  }, [childFacilities, userFacilityType, userFacilityId, selectedHealthArea]);

  // Build stats params
  const statsParams = useMemo(() => ({
    granularity: granularity,
    start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  }), [dateRange, granularity]);

  // Determine which facility ID to use dynamically based on selections
  const targetFacilityId = useMemo(() => {
    let facilityId: string | undefined;

    if (userFacilityType === "health_center") {
      // Health center users always use their own facility ID
      facilityId = userFacilityId;
    } else if (userFacilityType === "health_area") {
      // Health area users: use selected health center, or fallback to their own ID
      facilityId = selectedHealthCenter || userFacilityId;
    } else {
      // District users: use selected health center > selected health area > undefined
      facilityId = selectedHealthCenter || selectedHealthArea || undefined;
    }

    console.log('🎯 Target Facility ID updated:', {
      userFacilityType,
      selectedHealthArea,
      selectedHealthCenter,
      targetFacilityId: facilityId
    });

    return facilityId;
  }, [userFacilityType, userFacilityId, selectedHealthCenter, selectedHealthArea]);

  // CORRECT ENDPOINT LOGIC:
  // - health_center → useGetHealthCenterStats
  // - health_area OR district → useGetFacilityStats
  const isHealthCenter = userFacilityType === "health_center";
  const statsQuery = isHealthCenter
    ? useGetHealthCenterStats({ ...statsParams })
    : useGetFacilityStats({ ...statsParams, child_facility_id: targetFacilityId });

  const stats = statsQuery.data;
  const isLoading = statsQuery.isLoading;

  // YOUR EXACT KPI CARD RENDERING — 100% PRESERVED
  const kpiData = useMemo(() => {
    if (!stats) return [];

    const base = [
      { title: 'Patient count', value: stats.patient_count || 0, iconUp: TrendDownIcon, iconD: TrendUpIcon, color: 'text-green-600', rate: 18 },
      { title: 'Currently Admitted', value: stats.currently_admitted || 0, iconUp: TrendDownIcon, iconD: TrendUpIcon, color: 'text-red-600', rate: 9 },
      { title: 'Deaths', value: stats.deaths || 0, iconUp: TrendDownIcon, iconD: TrendUpIcon, color: 'text-red-600', rate: 0 },
    ];

    if (!isHealthCenter) {
      base.push({
        title: 'Referred Cases',
        value: (stats as any).referred_cases || 0,
        iconUp: TrendDownIcon,
        iconD: TrendUpIcon,
        color: 'text-green-600',
        rate: 12
      });
    }

    return base;
  }, [stats, isHealthCenter]);

  // Line Chart Data
  const chartData = useMemo(() => {
    if (!stats?.series_stats) return [];
    const dates = Object.keys(stats.series_stats.consulted || {});
    return dates.map(date => ({
      date: format(new Date(date), "dd"),
      consulted: stats.series_stats.consulted[date] || 0,
      admitted: stats.series_stats.admitted[date] || 0,
      deaths: stats.series_stats.deaths[date] || 0,
    }));
  }, [stats]);

  // Disease Data
  const diseaseData = useMemo(() => {
    if (!stats?.disease_occurance) return [];
    return Object.entries(stats.disease_occurance)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 antialiased">
      <div className=" mx-auto space-y-6">

        {/* Filters — Only for district & health_area */}
        {(userFacilityType === "district" || userFacilityType === "health_area") && (
          <Card className="border-none shadow-none bg-inherit">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:flex justify-between gap-10">
                {/* Granularity Buttons */}
                <div className=" md:width-[40vw]">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Granularity</label>
                  <div className="flex gap-3 w-1/2">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={granularity === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGranularity(type)}
                        className={`flex-1 capitalize border-none shadow-sm py-6 px-10 ${granularity === type
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white hover:bg-gray-50'
                          }`}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 w-1/2">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full py-6 shadow-sm border-none justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from && dateRange?.to
                            ? `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
                            : "Select date range"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 font-[500]" align="start">
                        <Calendar
                          mode="range"
                          className='w-full'
                          selected={dateRange}
                          onSelect={setDateRange}
                          fromYear={2020}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {userFacilityType === "district" && (
                    <div className="flex-1">
                      <label className="text-sm font-[500] text-gray-700 mb-2 block">Health Area</label>
                      <Select
                        value={selectedHealthArea}
                        onValueChange={(value) => {
                          setSelectedHealthArea(value);
                          // Reset health center when health area changes
                          setSelectedHealthCenter("");
                        }}
                      >
                        <SelectTrigger className="p-6 font-[500] border-none shadow-sm bg-white">
                          <SelectValue placeholder="All Health Areas" />
                        </SelectTrigger>
                        <SelectContent>
                          {healthAreas.map((area: any) => (
                            <SelectItem key={area._id} value={area._id} className='py-4 font-[500]'>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Health Center Dropdown */}
                  {(userFacilityType === "district" || userFacilityType === "health_area") && healthCenters.length > 0 && (
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Health Center</label>
                      <Select value={selectedHealthCenter} onValueChange={setSelectedHealthCenter}>
                        <SelectTrigger className="p-6 font-[500] border-none shadow-sm bg-white">
                          <SelectValue placeholder="All Health Centers" />
                        </SelectTrigger>
                        <SelectContent>
                          {healthCenters.map((center: any) => (
                            <SelectItem className='py-4 font-[500]' key={center._id} value={center._id}>
                              {center.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* YOUR EXACT KPI CARDS — 100% PRESERVED */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi: any, index: number) => (
            <Card key={index} className="text-center rounded-sm border-none shadow-sm">
              <CardContent className="p-6 pt-8 pb-6 flex flex-col items-center space-y-2">
                <p className="text-sm text-gray-600 general-size">{kpi.title}</p>
                <div className="text-4xl font-extrabold text-gray-900">
                  {isLoading ? "..." : kpi.value}
                </div>
                <div className='flex gap-1'>
                  {kpi.rate > 9 ? (
                    <kpi.iconD className={`${kpi.color}`} />
                  ) : (
                    <kpi.iconUp className={`${kpi.color}`} />
                  )}
                  <span className={`${kpi.color} text-sm font-[400]`}>{kpi.rate}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Data Message */}
        {!isLoading && !stats && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <DatabaseIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-sm text-gray-600">
                    {targetFacilityId
                      ? "No statistics found for the selected facility and date range."
                      : "Please select a health area or health center to view statistics."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Admission Report */}
        <Card className='rounded-sm border-none shadow-sm'>
          <CardHeader className="p-4 md:p-6 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg font-semibold whitespace-nowrap order-1">
                Patient Admission Report
              </CardTitle>
              <div className="flex items-center space-x-4 md:space-x-8 text-sm general-size font-medium text-gray-700 order-2 mx-auto sm:mx-0">
                <span className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-yellow-400 shadow-sm"></div>
                  Consulted
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-blue-700 shadow-sm"></div>
                  Admitted
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-red-600 shadow-sm"></div>
                  Deaths
                </span>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap order-3">
                <BoxArrowDownIcon className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#333' }} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="consulted" stroke="#f59e0b" strokeWidth={3.5} dot={false} />
                  <Line type="monotone" dataKey="admitted" stroke="#2563eb" strokeWidth={3.5} dot={false} />
                  <Line type="monotone" dataKey="deaths" stroke="#dc2626" strokeWidth={3.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Disease + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className='rounded-sm border-none shadow-sm'>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Disease Occurrence Report</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setChartType(chartType === 'bar' ? 'pie' : 'bar')}>
                  {chartType === 'bar' ? 'Pie Chart' : 'Bar Chart'}
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <DatabaseIcon className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {chartType === 'bar' ? (
                <div className="space-y-4">
                  {diseaseData.map((disease, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 w-24">{disease.name}</span>
                      <div className="w-64 bg-gray-200 h-6">
                        <div
                          className="bg-blue-600 h-6 transition-all duration-300 ease-in-out"
                          style={{ width: `${disease.value}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8 text-right">{disease.value}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={diseaseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {diseaseData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className='rounded-sm border-none shadow-sm'>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Location: {userFacility?.name || "N/A"}
                </CardTitle>
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="p-0 rounded-none">
              <div className="overflow-hidden h-[400]">
                <GoogleMapViewer
                  address={userFacility?.address || "Douala"}
                  facilityName={userFacility?.name || "General"}
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;