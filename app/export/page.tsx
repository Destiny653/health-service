'use client';

import React, { useEffect, useState } from 'react';
import DiseaseReportTemplate from '@/components/pdf/DiseaseReportTemplate';

export default function Export() {
    const [data, setData] = useState<any[]>([]);
    const [metadata, setMetadata] = useState<any>({});

    useEffect(() => {
        // Read from sessionStorage
        const storedData = localStorage.getItem('diseaseReportData');
        const storedMetadata = localStorage.getItem('diseaseReportMetadata');

        if (storedData && storedMetadata) {
            setData(JSON.parse(storedData));
            setMetadata(JSON.parse(storedMetadata));
        } else {
            // Fallback to mock data for testing
            const mockData = [
                {
                    id: 1,
                    name: 'Malaria',
                    isNotifiable: false,
                    suspected: {
                        '0-14': { m: '12', f: '8' },
                        '15-24': { m: '5', f: '7' },
                        '25-49': { m: '9', f: '11' },
                        '60+': { m: '3', f: '4' },
                    },
                    deaths: {
                        '0-14': { m: '0', f: '1' },
                        '15-24': { m: '0', f: '0' },
                        '25-49': { m: '1', f: '0' },
                        '60+': { m: '2', f: '1' },
                    },
                    samples: '15',
                    confirmed: '10',
                },
                {
                    id: 2,
                    name: 'Cholera',
                    isNotifiable: true,
                    suspected: {
                        '0-14': { m: '3', f: '2' },
                        '15-24': { m: '4', f: '3' },
                        '25-49': { m: '5', f: '4' },
                        '60+': { m: '1', f: '2' },
                    },
                    deaths: {
                        '0-14': { m: '0', f: '0' },
                        '15-24': { m: '0', f: '0' },
                        '25-49': { m: '1', f: '0' },
                        '60+': { m: '0', f: '1' },
                    },
                    samples: '8',
                    confirmed: '6',
                },
                {
                    id: 3,
                    name: 'COVID -19',
                    isNotifiable: true,
                    suspected: {
                        '0-14': { m: '2', f: '1' },
                        '15-24': { m: '6', f: '5' },
                        '25-49': { m: '8', f: '7' },
                        '60+': { m: '4', f: '3' },
                    },
                    deaths: {
                        '0-14': { m: '0', f: '0' },
                        '15-24': { m: '0', f: '0' },
                        '25-49': { m: '1', f: '1' },
                        '60+': { m: '2', f: '1' },
                    },
                    samples: '12',
                    confirmed: '8',
                },
            ];

            const mockMetadata = {
                facilityName: 'Mbingo Regional Hospital',
                region: '',
                healthDistrict: 'Mbingo Regional Hospital',
                healthArea: '',
                year: '2023',
                epidemiologicalWeek: '23',
                submissionDate: '2023-06-05',
                receivedDate: '2023-06-06',
                submitterName: 'Dr. John Doe',
            };

            setData(mockData);
            setMetadata(mockMetadata);
        }
    }, []);

    return (
        <div className="flex justify-center items-center h-screen mt-[200]">
            <DiseaseReportTemplate data={data} metadata={metadata} />
        </div>
    );
}
