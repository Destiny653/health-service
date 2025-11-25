import React from 'react';
import { format } from 'date-fns';

interface DiseaseRow {
    id: number;
    name: string;
    isNotifiable: boolean;
    suspected: {
        '0-14': { m: string; f: string };
        '15-24': { m: string; f: string };
        '25-49': { m: string; f: string };
        '60+': { m: string; f: string };
    };
    deaths: {
        '0-14': { m: string; f: string };
        '15-24': { m: string; f: string };
        '25-49': { m: string; f: string };
        '60+': { m: string; f: string };
    };
    samples: string;
    confirmed: string;
}

interface DiseaseReportTemplateProps {
    data: DiseaseRow[];
    metadata: {
        facilityName?: string;
        region?: string;
        healthDistrict?: string;
        healthArea?: string;
        year?: string;
        epidemiologicalWeek?: string;
        submissionDate?: string;
        receivedDate?: string;
        submitterName?: string;
    };
}

export const DiseaseReportTemplate = React.forwardRef<HTMLDivElement, DiseaseReportTemplateProps>(
    ({ data, metadata }, ref) => {
        return (
            <div ref={ref} className=" flex flex-col item-center overflow-hidden" style={styles.page}>
                {/* ===== TRI-COLUMN HEADER ===== */}
                <div style={styles.header}>
                    {/* Left Column - French */}
                    <div style={styles.headerLeft} className='flex flex-col justify-center items-center'>
                        <p style={styles.headerText}>République du Cameroun</p>
                        <p style={styles.headerText}>MINISTERE DE LA SANTE PUBLIQUE</p>
                    </div>

                    {/* Center Column - Logo */}
                    <div style={styles.headerCenter}>
                        <div className='h-[60px] w-[60px]'>
                           <img src="/images/healthlogo.png" alt="health-logo" />
                        </div>
                    </div>

                    {/* Right Column - English */}
                    <div style={styles.headerRight} className='flex flex-col justify-center items-center'>
                        <p style={styles.headerText}>Republic of Cameroon</p>
                        <p style={styles.headerText}>MINISTRY OF PUBLIC HEALTH</p>
                    </div>
                </div>

                {/* ===== SUBTITLE ===== */}
                <div style={styles.subtitle} className='flex flex-col justify-center items-center gap-2 bg-gray-100 py-2 px-1'>
                    <h2 className='text-[9px] font-bold'>TICHE DE NOTIFICATION HEBDOMADAIRE DES MALADIES APOTENTIEL EPIDEMIQUE, AFFECTIONS PRIORITAIRES ET AUTRES EVENMENTS DE SANTE PUBLIQUE</h2>
                    <h2 className='text-[9px] font-bold'>FORM FOR WEEKLY NTIFICATION OF SURVEILLANCE OF EPIDEMIC PRONE DISEASES, PRIORITY CONDITIONS AND OTHER PUBLIC HEALTH EVENTS </h2>
                    <p className='text-[8px]'>(Fiche niceau de la Formation Sanitaire/ Health Unit's Form)</p>
                </div>

                {/* ===== FORM SECTIONS ===== */}
                <div style={styles.formSection} className='flex justify-between gap-2'>
                    {/* Section 1 */}
                    <div style={styles.formRow} className='flex items-center justify-center flex-col space-y-10'>
                        <div className='flex items-center justify-center flex-col'>
                            <strong className=''>Région / Region:</strong>
                            <input type="text" value='' className='border border-black py-2 px-6 bg-gray-200' />
                        </div>
                        <div style={styles.formField} className='flex items-center justify-center flex-col'>
                            <strong>Semaine Épidémiologique / Week:</strong>
                            <input type="text" value='' className='border border-black py-2 px-6 bg-gray-200' />
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div style={styles.formRow} className='flex items-center justify-center flex-col'>
                        <div style={styles.formFieldFull} className='flex items-center justify-center flex-col'>
                            <strong>District Santé / Health District:</strong>
                            <input type="text" value='' className='border border-black py-2 px-6 w-[250px] bg-gray-200' />
                        </div>
                        <div style={styles.formFieldFull} className='flex items-center justify-center flex-col'>
                            <strong className='text-nowrap'>Nom de la Formation Santaire / Name of the Health Unit:</strong>
                            <input type="text" value='' className='border border-black py-2 px-6 w-[280px] bg-gray-200' />
                        </div>
                        <div style={styles.formFieldFull} className='flex items-center justify-center gap-2'>
                            <strong>De / From</strong>
                            <input type="text" value='' className='border border-black py-2 px-4 w-[120px] bg-gray-200' />
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div style={styles.formRow} className='flex items-center justify-center flex-col'>
                        <div style={styles.formField} className='flex items-center justify-center flex-col'>
                            <strong>Aire de Santé / Health Area:</strong>
                            <input type="text" value='' className='border border-black py-2 px-6 w-[250px] bg-gray-200' />
                        </div>
                        <div style={styles.formFieldSmall} className='flex items-center justify-center flex-col'>
                            <strong>Année / Year:</strong>
                            <input type="text" value='' className='border border-black py-2 px-6 w-[120px] bg-gray-200' />
                        </div>
                        <div style={styles.formFieldSmall} className='flex items-center justify-center relative'>
                            <strong className='absolute top-1/4 -left-11'>Au / To:</strong>
                            <input type="text" value='' className='border border-black py-2 px-4 w-[120px] bg-gray-200' />
                        </div>
                    </div>
                </div>

                {/* ===== DISEASE TABLE ===== */}
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            {/* Header Row 1 - Main Categories */}
                            <tr>
                                <th rowSpan={3} style={{ ...styles.th, width: '30px' }}>
                                    No
                                </th>
                                <th rowSpan={3} style={{ ...styles.th, width: '150px', textAlign: 'left' }}>
                                    MALADIES
                                </th>
                                <th colSpan={8} style={styles.thMain}>
                                    SUSPECTED CASES
                                </th>
                                <th colSpan={8} style={styles.thMain}>
                                    DEATHS
                                </th>
                                <th rowSpan={3} style={{ ...styles.th, width: '50px' }}>
                                    Sample Cases
                                </th>
                                <th rowSpan={3} style={{ ...styles.th, width: '50px' }}>
                                    Confirmed
                                </th>
                            </tr>

                            {/* Header Row 2 - Age Groups */}
                            <tr>
                                <th colSpan={2} style={styles.thAge}>0-14</th>
                                <th colSpan={2} style={styles.thAge}>15-24</th>
                                <th colSpan={2} style={styles.thAge}>25-49</th>
                                <th colSpan={2} style={styles.thAge}>60+</th>
                                <th colSpan={2} style={styles.thAge}>0-14</th>
                                <th colSpan={2} style={styles.thAge}>15-24</th>
                                <th colSpan={2} style={styles.thAge}>25-49</th>
                                <th colSpan={2} style={styles.thAge}>60+</th>
                            </tr>

                            {/* Header Row 3 - Gender */}
                            <tr>
                                {[...Array(16)].map((_, i) => (
                                    <th key={i} style={styles.thGender}>
                                        {i % 2 === 0 ? 'M' : 'F'}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {data.map((row) => (
                                <tr key={row.id}>
                                    <td style={styles.td}>{row.id.toString().padStart(2, '0')}</td>
                                    <td style={{ ...styles.td, textAlign: 'left' }}>
                                        {row.name}
                                        {row.isNotifiable ? ' *' : ''}
                                    </td>
                                    {/* Suspected Cases */}
                                    <td style={styles.td}>{row.suspected['0-14'].m}</td>
                                    <td style={styles.td}>{row.suspected['0-14'].f}</td>
                                    <td style={styles.td}>{row.suspected['15-24'].m}</td>
                                    <td style={styles.td}>{row.suspected['15-24'].f}</td>
                                    <td style={styles.td}>{row.suspected['25-49'].m}</td>
                                    <td style={styles.td}>{row.suspected['25-49'].f}</td>
                                    <td style={styles.td}>{row.suspected['60+'].m}</td>
                                    <td style={styles.td}>{row.suspected['60+'].f}</td>
                                    {/* Deaths */}
                                    <td style={styles.td}>{row.deaths['0-14'].m}</td>
                                    <td style={styles.td}>{row.deaths['0-14'].f}</td>
                                    <td style={styles.td}>{row.deaths['15-24'].m}</td>
                                    <td style={styles.td}>{row.deaths['15-24'].f}</td>
                                    <td style={styles.td}>{row.deaths['25-49'].m}</td>
                                    <td style={styles.td}>{row.deaths['25-49'].f}</td>
                                    <td style={styles.td}>{row.deaths['60+'].m}</td>
                                    <td style={styles.td}>{row.deaths['60+'].f}</td>
                                    {/* Sample and Confirmed */}
                                    <td style={styles.td}>{row.samples}</td>
                                    <td style={styles.td}>{row.confirmed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-[10px] font-bold">* Maladie a notification immediate / Immediate notification diseases</p>
                </div>

                {/* ===== FOOTER SECTION ===== */}
                <div style={styles.footer}>
                    <div style={styles.footerRow} className="flex">
                        <div style={styles.footerField}>
                            <div style={styles.footerLabel}>Date of submission in the health area: ............</div>
                        </div>
                        <div style={styles.footerField}>
                            <div style={styles.footerLabel}>Date received: ............</div>
                        </div>
                        <div style={styles.footerField}>
                            <div style={styles.footerLabel} className="text-nowrap">Nom, Signature et cache / Name, Signature and Round Stamp</div>
                        </div>
                    </div>

                    <section className='p-0'>
                        <div className='p-0 m-0 flex gap-1 items-center'>
                            <div className='border border-black py-2 bg-gray-300 w-[200px]' />
                            <span className="text-black text-[10px] ">Zone reservee au Ds</span>
                        </div>
                        <div className='p-0 m-0 flex gap-1 items-center'>
                            <div className='border-x py-2 border-black w-[200px]' />
                            <span className="text-black text-[10px]">Zone reservee a la FOSA</span>
                        </div>
                        <div className='p-0 m-0 flex gap-1 items-center'>
                            <div className='border border-black py-2 bg-black w-[200px]' />
                            <span className="text-black text-[10px]">Aucun remplissage</span>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
);

DiseaseReportTemplate.displayName = 'DiseaseReportTemplate';

// Styles object for the PDF template
const styles: { [key: string]: React.CSSProperties } = {
    page: {
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '10pt',
        color: '#000',
    },

    // Header styles
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
        fontSize: '9pt',
    },
    headerLeft: {
        textAlign: 'left',
        flex: 1,
    },
    headerCenter: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        textAlign: 'right',
        flex: 1,
    },
    headerText: {
        margin: '2px 0',
        fontWeight: 'bold',
        fontSize: '9pt',
    },
    logoPlaceholder: {
        width: '60px',
        height: '60px',
        border: '1px solid #000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '8pt',
    },

    // Subtitle
    subtitle: {
        textAlign: 'center',
        marginBottom: '15px',
    },

    // Form sections
    formSection: {
        marginBottom: '15px',
        fontSize: '8pt',
    },
    formRow: {
        display: 'flex',
        gap: '10px',
        marginBottom: '6px',
    },
    formField: {
        flex: 1,
    },
    formFieldFull: {
        width: '100%',
    },
    formFieldSmall: {
        flex: '0 0 auto',
        minWidth: '120px',
    },

    // Table styles
    tableWrapper: {
        marginBottom: '15px',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '7pt',
        border: '1px solid #000',
    },
    th: {
        border: '1px solid #000',
        padding: '4px 2px',
        backgroundColor: '#e8e8e8',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    thMain: {
        border: '1px solid #000',
        padding: '4px 2px',
        backgroundColor: '#d0d0d0',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    thAge: {
        border: '1px solid #000',
        padding: '4px 2px',
        backgroundColor: '#e8e8e8',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: '7pt',
    },
    thGender: {
        border: '1px solid #000',
        padding: '4px 2px',
        backgroundColor: '#e8e8e8',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: '6pt',
    },
    td: {
        border: '1px solid #000',
        padding: '4px 2px',
        textAlign: 'center',
    },

    // Footer styles
    footer: {
        marginTop: '20px',
    },
    footerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '10px',
        marginBottom: '15px',
        fontSize: '7pt',
    },
    footerField: {
        flex: 1,
    },
    footerLabel: {
        fontWeight: 'bold',
        marginBottom: '3px',
    },
    footerValue: {
        borderBottom: '1px solid #000',
        minHeight: '20px',
    },
    signatureBox: {
        border: '1px solid #000',
        height: '40px',
        marginTop: '3px',
    },
    footerNote: {
        textAlign: 'center',
        fontSize: '7pt',
        fontStyle: 'italic',
    },
};

export default DiseaseReportTemplate;
