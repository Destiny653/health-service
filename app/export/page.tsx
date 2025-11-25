import React from 'react';
import DiseaseReportTemplate from '@/components/pdf/DiseaseReportTemplate';

export default function Export() {
    return <div className="flex justify-center items-center h-screen mt-[200]">
        <DiseaseReportTemplate data={[]} metadata={{}} />
    </div>;
}
 