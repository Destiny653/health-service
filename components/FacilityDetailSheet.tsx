'use client';

import * as React from 'react';
import {
    X,
    MapPin,
    Phone,
    Mail,
    Globe,
    Building,
    Home,
    Users,
    User,
    Briefcase,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import GoogleMapViewer from './GoogleMapViewer'
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';

interface FacilityDetails {
    facilityName: string;
    address: string;
    division: string;
    healthDistrict: string;
    municipality: string;
    phone: string;
    email: string;
    site: string;
}
interface ContactPersonel {
    firstName: string;
    lastName: string;
    role: string;
    tel1: string;
    tel2?: string;
    email: string;
}

interface FacilityDetailSheetProps {
    open: boolean;
    activeTab: 'details' | 'map';
    onTabChange: (value: 'details' | 'map') => void;
    onOpenChange: (open: boolean) => void;
    facility?: {
        id: string;
        facilityName: string;
        address: string;
        details?: FacilityDetails;
        contacts?: ContactPersonel[];
    };
    mapComponent?: React.ReactNode;
}

export function FacilityDetailSheet({
    open,
    onTabChange,
    onOpenChange,
    activeTab,
    facility,
    mapComponent
}: FacilityDetailSheetProps) {
    if (!facility) return null;

    const {
        facilityName,
        address,
        details = {} as FacilityDetails,
        contacts = [],
    } = facility;

    /* ------------------------------------------------------------------ */
    /* Icon + Text helper (kept exactly as you styled it)                */
    /* ------------------------------------------------------------------ */
    const IconText = ({
        icon: Icon,
        label,
        value,
    }: {
        icon: React.FC<any>;
        label: string;
        value?: string;
    }) => (
        <div className="flex items-start gap-3 text-sm pb-4">
            <Icon className="w-4 h-4 text-[#8D7575]" />
            <div className="flex items-center gap-4">
                <span className="font-medium text-[#8D7575]">{label}</span>
                <span
                    className={`font-semibold ${['Tel 1', 'Tel 2', 'Phone'].includes(label)
                        ? 'text-[#021EF5]'
                        : 'text-gray-900'
                        }`}
                >
                    {value || '-'}
                </span>
            </div>
        </div>
    );

    /* ------------------------------------------------------------------ */
    /* MAP CARD (the exact markup you gave)                              */
    /* ------------------------------------------------------------------ */

    const MapCard = () => (
        <Card className="rounded-sm border-none shadow-sm w-[50vw] mx-auto align-middle">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold pb-5">
                        Location: {details.address || '—'}
                    </CardTitle>
                    <MapPin className="h-5 w-5 text-blue-600" />
                </div>
            </CardHeader>
            <CardContent className="p-0 h-[600]">
                <div className="h-full">
                    {mapComponent}
                </div>
            </CardContent>
        </Card>
    )


    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTitle></SheetTitle>
            <SheetContent side="bottom" className="h-[85vh] p-0">
                {/* ------------------------------------------------------------------ */}
                {/* Tabs (no header – you removed it)                                 */}
                {/* ------------------------------------------------------------------ */}
                <Tabs defaultValue={activeTab} className="flex flex-col h-full">
                    {/* Tab bar – custom styling you already wrote */}
                    <div className="w-full py-[9px] rounded-none p-0 m-0 border-b bg-white">
                        <TabsList className="grid grid-cols-2 w-fit rounded-none p-0 pl-2 m-0 shadow-none bg-white">
                            <TabsTrigger
                                value="details"
                                onClick={() => onTabChange('details')}
                                className="w-fit py-3 data-[state=active]:border-b-2 rounded-none shadow-none data-[state=active]:border-[#021EF5] data-[state=active]:shadow-none data-[state=active]:text-[#021EF5]"
                            >
                                General Details
                            </TabsTrigger>

                            <TabsTrigger
                                value="map"
                                onClick={() => onTabChange('map')}
                                className="w-fit py-3 data-[state=active]:border-b-2 rounded-none shadow-none data-[state=active]:border-[#021EF5] data-[state=active]:shadow-none data-[state=active]:text-[#021EF5]"
                            >
                                Map
                            </TabsTrigger>
                        </TabsList>

                    </div>


                    {/* ------------------------------------------------------------------ */}
                    {/* DETAILS TAB */}
                    {/* ------------------------------------------------------------------ */}
                    <TabsContent value="details" className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                                {/* LEFT – Facility Details */}
                                <div>
                                    <h3 className="mb-5 text-base font-semibold flex items-center gap-2">
                                        Facility Details
                                    </h3>
                                    <div className="space-y-4">
                                        <IconText icon={Building} label="Facility Name" value={details.facilityName} />
                                        <IconText icon={MapPin} label="Address" value={details.address} />
                                        <IconText icon={Home} label="Health District" value={details.healthDistrict} />
                                        <IconText icon={Users} label="Municipality" value={details.municipality} />
                                        <IconText icon={Building} label="Division" value={details.division} />
                                        <IconText icon={Phone} label="Phone" value={details.phone} />
                                        <IconText icon={Mail} label="Email" value={details.email} />
                                        <IconText icon={Globe} label="Site" value={details.site} />
                                    </div>
                                </div>

                                {/* RIGHT – Contact Personnels */}
                                <div className="border-l px-4">
                                    <h3 className="mb-4 text-base font-semibold flex items-center">
                                        Contact Personnels
                                    </h3>
                                    <div className="space-y-6">
                                        {contacts.length === 0 ? (
                                            <p className="text-sm text-gray-500">No contact persons recorded.</p>
                                        ) : (
                                            contacts.map((c, i) => (
                                                <div key={i} className="border-b pb-4">
                                                    <div className="space-y-2 text-sm">
                                                        <IconText icon={User} label="First Name" value={c.firstName} />
                                                        <IconText icon={User} label="Last Name" value={c.lastName} />
                                                        <IconText icon={Briefcase} label="Role" value={c.role} />
                                                        <IconText icon={Phone} label="Tel 1" value={c.tel1} />
                                                        {c.tel2 && <IconText icon={Phone} label="Tel 2" value={c.tel2} />}
                                                        <IconText icon={Mail} label="Email" value={c.email} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* ------------------------------------------------------------------ */}
                    {/* MAP TAB – now fully functional */}
                    {/* ------------------------------------------------------------------ */}
                    <TabsContent value="map" className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full p-4 w-full bg-gray-50 flex items-center justify-center">
                            <MapCard />
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}