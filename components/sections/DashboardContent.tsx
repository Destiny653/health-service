import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Bed, Heart, ExternalLink, Download, MapPin } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  Legend,
} from 'recharts';

// Colors used in the image: yellow-600, blue-600, red-600
const COLOR_CONSULTED = '#f59e0b'; // Tailwind yellow-600
const COLOR_ADMITTED = '#2563eb'; // Tailwind blue-600
const COLOR_DEATHS = '#dc2626'; // Tailwind red-600

// Mock Data for KPI Cards
const kpiData = [
  { title: 'Patient count', value: 18, icon: Users, color: 'text-blue-600' },
  { title: 'Currently Admitted', value: 26, icon: Bed, color: 'text-blue-600' },
  { title: 'Deaths', value: 0, icon: Heart, color: 'text-red-600' },
  { title: 'Referred Cases', value: 6, icon: ExternalLink, color: 'text-gray-600' },
];

// ADJUSTED: Mock Data for Patient Admission Line Chart to match the shape in the uploaded image
// Consulted: steady increase from ~10 to ~50
// Admitted: start ~10, jump to ~30, flat ~30, dip to ~10, up to ~25
// Deaths: start ~5, up to ~15, down to ~5, up to ~10
const chartData = [
  { date: 1, consulted: 21, admitted: 10, deaths: 5 },
  { date: 2, consulted: 25, admitted: 25, deaths: 15 },
  { date: 3, consulted: 29, admitted: 30, deaths: 10 },
  { date: 4, consulted: 32, admitted: 30, deaths: 5 },
  { date: 5, consulted: 35, admitted: 30, deaths: 5 },
  { date: 6, consulted: 38, admitted: 10, deaths: 5 },
  { date: 7, consulted: 40, admitted: 25, deaths: 10 },
  { date: '', consulted: 40, admitted: 25, deaths: 10 },

];

// Mock Data for Disease Bar Chart
const diseaseData = [
  { name: 'Rabies', value: 5 },
  { name: 'Cholera', value: 90 },
  { name: 'Measles', value: 75 },
  { name: 'Dog Bite', value: 50 },
  { name: 'Stillbirth', value: 10 },
  { name: 'Malaria', value: 70 },
];

const DashboardContent = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 antialiased">
      <div className=" mx-auto space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="text-center rounded-sm shadow-none">
              <CardContent className="p-6 pt-8 pb-6 flex flex-col items-center space-y-2">
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
                <div className="text-4xl font-extrabold text-gray-900">{kpi.value}</div>
                <p className="text-sm text-gray-600">{kpi.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Patient Admission Report - UPDATED TO MATCH IMAGE */}
        <Card className='rounded-sm shadow-none'>
          <CardHeader className="p-4 md:p-6 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Title (Left) */}
              <CardTitle className="text-lg font-semibold whitespace-nowrap order-1">
                Patient Admission Report
              </CardTitle>

              {/* Legend (Center) */}
              <div className="flex items-center space-x-4 md:space-x-8 text-sm font-medium text-gray-700 order-2 mx-auto sm:mx-0">
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

              {/* Button (Right) */}
              <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap order-3">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }} // Adjusted margins for axis labels
                >
                  {/* Grid lines look lighter in the image */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                  {/* X-Axis: "Date" Label, visible axis line */}
                  <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#333' }} tickMargin={10}>
                    <Label
                      value="Date"
                      offset={-20}
                      position="insideBottomRight"
                      style={{ fill: '#333', fontSize: '14px' }}
                    />
                  </XAxis>

                  {/* Y-Axis: "Patients" Label, invisible axis line */}
                  <YAxis tickLine={false} axisLine={false} tickMargin={10}>
                    <Label
                      value="Patients"
                      angle={-90}
                      position="insideLeft"
                      style={{ textAnchor: 'middle', fill: '#333', fontSize: '14px' }}
                    />
                  </YAxis>

                  <Tooltip />
                  {/* Removed Recharts <Legend /> since we're using a custom one in the CardHeader */}
                  {/* <Legend />  */}

                  {/* Lines with updated colors, thickness, and type="monotone" for smoothness */}
                  <Line type="monotone" dataKey="consulted" stroke={COLOR_CONSULTED} strokeWidth={3.5} dot={false} name="Consulted" />
                  <Line type="monotone" dataKey="admitted" stroke={COLOR_ADMITTED} strokeWidth={3.5} dot={false} name="Admitted" />
                  <Line type="monotone" dataKey="deaths" stroke={COLOR_DEATHS} strokeWidth={3.5} dot={false} name="Deaths" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Disease Occurrence and Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disease Occurrence Report */}
          <Card className='rounded-sm shadow-none'>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Disease Occurrence Report</CardTitle>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {diseaseData.map((disease, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 w-24">{disease.name}</span>
                  <div className="w-64 bg-gray-200 h-6">
                    <div
                      className="bg-blue-600 h-6 transition-all duration-300 ease-in-out"
                      style={{ width: `${disease.value}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{disease.value}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Location Map */}
          <Card className='rounded-sm shadow-none'>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Location: Rond Point Maiture</CardTitle>
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="p-0 rounded-none">
              <div className=" overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.684057099999!2d9.740000!3d4.050000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMDMnMDAuMCJOIDPCsEw0JzAwLjAiRQ!5e0!3m2!1sen!2sus!4v1690000000000!5m2!1sen!2sus"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Rond Point Maiture, Douala"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;