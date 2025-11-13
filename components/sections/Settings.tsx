'use client';

import React, { useState } from 'react';
import {
    Mail,
    ChevronRight,
} from 'lucide-react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '../PatientsTable';
import { ContactPersonnel, contactPersonnels, notification } from '@/data';
import {
    BellIcon,
    UserIcon,
    UsersIcon,
    ShieldIcon,
    FileIcon,
    PlusIcon,
    EyeSlashIcon,
    MagnifyingGlassIcon,
} from "@phosphor-icons/react";

// interface ContactPersonnel {
//     id: string;
//     firstName: string;
//     lastName: string;
//     role: string;
//     tel1: string;
//     tel2?: string;
//     institution: string;
//     email: string;
//     lastActivity: string;
// }

// const contactPersonnels: ContactPersonnel[] = [
//     {
//         id: '1',
//         firstName: 'Emmanuel',
//         lastName: 'Ngong',
//         role: 'Chief Medical Officer',
//         tel1: '+237 677 543 210',
//         tel2: '+237 699 102 334',
//         institution: 'The Martins',
//         email: 'emmanuel.ngong@stmaryhealth.org',
//         lastActivity: 'oct 19 | 15:16',
//     },
//     {
//         id: '2',
//         firstName: 'Brenda',
//         lastName: 'Ewane',
//         role: 'Nursing Supervisor',
//         institution: 'St. Bless',
//         tel1: '+237 670 998 877',
//         tel2: '+237 680 112 009',
//         email: 'b.ewane@bamendaregional.cm',
//         lastActivity: 'Yesterday',
//     },
// ];

// const notifications = [
//     {
//         title: 'Upcoming vaccination campaigns',
//         date: 'oct 17',
//         content: `Date: October 17\nThe Ministry notifies everyone about the upcoming vaccination campaigns that will take place across all health districts. Citizens are encouraged to participate and ensure their vaccination cards are updated.`,
//     },
//     {
//         title: 'Pregnancy Kits Available',
//         date: 'oct 18',
//         content: `Date: October 18\nThe Ministry informs all health centers and the general public that pregnancy kits are now available in designated facilities. Kindly visit your nearest health center for assistance.`,
//     },
//     {
//         title: 'National AIDS activities',
//         date: 'oct 19',
//         content: `Date: October 19\nThe Ministry announces the commencement of National AIDS awareness activities aimed at prevention, testing, and counseling. Everyone is invited to participate and spread awareness.`,
//     },
//     {
//         title: 'Breast Cancer Month',
//         date: 'oct 20',
//         content: `Date: October 20\nThe Ministry reminds all citizens that October is Breast Cancer Awareness Month. Early detection saves lives—visit the nearest hospital for screening and education programs.`,
//     },
// ];

// === MAIN COMPONENT ===
export default function Settings() {
    const [activeMenu, setActiveMenu] = useState('Notifications');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        tel1: '',
        tel2: '',
        email: '',
        role: '',
        password: '',
        repeatPassword: '',
    });

    const [searchQuery, setSearchQuery] = useState('');

    const filteredContactPersonnels = contactPersonnels.filter(person => {
        const query = searchQuery.toLowerCase();
        return (
            person.firstName.toLowerCase().includes(query) ||
            person.lastName.toLowerCase().includes(query) ||
            person.email.toLowerCase().includes(query) ||
            person.role.toLowerCase().includes(query) ||
            person.institution.toLowerCase().includes(query) ||
            person.tel1.toLowerCase().includes(query) ||
            (person.tel2 && person.tel2.toLowerCase().includes(query))
        );
    });

    const currentUser = contactPersonnels[0];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateUser = () => {
        console.log('Creating user:', formData);
        setIsSheetOpen(false);
        setFormData({
            firstName: '',
            lastName: '',
            tel1: '',
            tel2: '',
            email: '',
            role: '',
            password: '',
            repeatPassword: '',
        });
    };

    const menuItems = [
        { id: 'Notifications', label: 'Notifications', icon: BellIcon },
        { id: 'Profile', label: 'Profile', icon: UserIcon },
        { id: 'Team', label: 'Team', icon: UsersIcon },
        { id: 'Security', label: 'Security', icon: ShieldIcon },
        { id: 'Terms', label: 'Terms of Service', icon: FileIcon },
    ];

    const columns = [
        { accessorKey: 'firstName', header: 'First Name', cell: (info: any) => `${info.getValue()} ${info.row.original.lastName}` },
        { accessorKey: 'email', header: 'Email/Username' },
        { accessorKey: 'tel1', header: 'Tel' },
        { accessorKey: 'lastActivity', header: 'Last Activity' },
    ];

    return (
        <div className="min-h-screen max-w-[100vw] bg-gray-50 flex">
            {/* === SIDEBAR === */}
            <aside className="w-64 bg-gray-50  pt-5">

                <NavigationMenu orientation="vertical" className="[&>div>svg]:hidden" >
                    <NavigationMenuList className="flex flex-col space-y-0 pt-5">
                        {menuItems.map((item) => (
                            <NavigationMenuItem key={item.id} className="w-full">
                                <button
                                    onClick={() => setActiveMenu(item.id)}
                                    className={`w-full flex items-center justify-start px-4 py-2 rounded-md text-left font-medium transition-colors ${activeMenu === item.id
                                        ? 'bg-[#C2E7FF] rounded-sm rounded-r-full'
                                        : 'hover:bg-gray-50 rounded-r-full'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.label}
                                </button>
                            </NavigationMenuItem>

                        ))}
                    </NavigationMenuList>
                </NavigationMenu>
            </aside>

            {/* === MAIN CONTENT === */}
            <main className="flex-1 pt-5 bg-gray-50">

                <div className="p-8 px-12 bg-gray-50 space-y-4  min-h-[94vh]">
                    {/* === NOTIFICATIONS === */}
                    {activeMenu === 'Notifications' && (
                        <div>
                            <Card className="shadow-sm max-w-4xl mx-auto -none border-none rounded-sm p-4">
                                <h1 className="text-xl font-semibold mb-6">Notifications</h1>
                                <Separator className='bg-gray-50' />
                                <CardContent className="p-6 space-y-5">

                                    <div className="space-y-4 flex flex-col gap-4">
                                        {notification.map((notif, index) => (
                                            <div key={index} className="bg-white">
                                                <div className="flex justify-between items-start ">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">{notif.content}</p>
                                                    </div>
                                                    <span className="text-sm text-gray-400 ml-4">{notif.date}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* === PROFILEIcon === */}
                    {activeMenu === 'Profile' && (
                        <div className='mx-auto'>
                            <Card className="shadow-sm max-w-3xl mx-auto border-none rounded-sm p-4">
                                <h1 className="text-xl font-bold pb-6 border-b border-gray-50">ProfileIcon Details</h1>
                                <CardContent className="p-6 space-y-5">
                                    {[
                                        { label: 'First Name', value: currentUser.firstName },
                                        { label: 'Last Name', value: currentUser.lastName },
                                        { label: 'Tel 1', value: currentUser.tel1 },
                                        { label: 'Tel 2 (optional)', value: currentUser.tel2 || '-' },
                                        { label: 'Email', value: currentUser.email },
                                        { label: 'Role', value: currentUser.role },
                                        { label: 'Institution', value: currentUser.institution },
                                    ].map((field) => (
                                        <div key={field.label}>
                                            <Label className="text-sm font-medium">{field.label}</Label>
                                            <Input value={field.value} className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* === TEAM === */}
                    {activeMenu === 'Team' && (
                        <Card className='shadow-sm border-none p-6 min-h-[60vh] bg-white rounded-sm'>
                            <h1 className="text-xl font-bold pb-6">Manage Users</h1>
                            <div className="flex justify-between items-center mb-6">
                                <div className='relative'>
                                    <Input
                                        type="search"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full md:w-auto pl-6 shadow-none outline-none"
                                    />
                                    <MagnifyingGlassIcon color={'#D9D9D9'} className='absolute top-1/4 left-1'/>
                                </div>
                                <Button onClick={() => setIsSheetOpen(true)} className="bg-[#028700] py-4 ml-auto rounded-sm hover:bg-[#028700dd]">
                                    <PlusIcon className="w-4 h-4 mr-2" /> Add User
                                </Button>
                            </div>
                            <div className='w-full'>
                                <DataTable
                                    data={filteredContactPersonnels}
                                    columns={columns}
                                    isLoading={false}
                                    onRowClick={(row: ContactPersonnel) => console.log('Clicked:', row)}
                                />
                            </div>
                        </Card>
                    )}

                    {/* === SECURITY === */}
                    {activeMenu === 'Security' && (
                        <div>
                            <Card className="shadow-sm max-w-3xl mx-auto rounded-sm  p-6 border-none">
                                <h1 className="text-xl font-bold mb-6">Update Password</h1>
                                <CardContent className="p-6 space-y-5">
                                    <div>
                                        <Label>Old Password</Label>
                                        <Input type="password" placeholder="*********" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                                    </div>
                                    <div>
                                        <Label>New Password</Label>
                                        <Input type="password" placeholder="*********" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                                    </div>
                                    <div>
                                        <Label>Repeat Password</Label>
                                        <Input type="password" placeholder="*********" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button className="py- bg-[#028700] rounded-sm hover:bg-[#028700eb]">Update Password</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* === TERMS === */}
                    {activeMenu === 'Terms' && (
                        <div>
                            <Card className="shadow-sm max-w-4xl p-6 rounded-sm  border-none mx-auto">
                                <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
                                <Separator className='bg-gray-50' />
                                <CardContent className="p-6 text-sm text-gray-600 leading-relaxed space-y-4">
                                    <p>
                                        Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
                                    </p>
                                    <p>
                                        Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
                                    </p>
                                    <p>
                                        Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>

            {/* === ADD USER SHEET (SLIDES FROM RIGHT) === */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="min-w-[40vw] p-0">
                    <SheetHeader className="p-4 border-b">
                        <div className="flex justify-between items-center">
                            <SheetTitle>Create User</SheetTitle>
                            {/* <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button> */}
                        </div>
                    </SheetHeader>

                    <div className="p-6 space-y-5 overflow-y-auto h-full">
                        <div className="space-y-4">
                            <div>
                                <Label>First Name</Label>
                                <Input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Amos" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                            </div>
                            <div>
                                <Label>Last Name</Label>
                                <Input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="James" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                            </div>
                            <div>
                                <Label>Tel 1</Label>
                                <Input name="tel1" value={formData.tel1} onChange={handleInputChange} placeholder="+237" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                            </div>
                            <div>
                                <Label>Tel 2 (optional)</Label>
                                <Input name="tel2" value={formData.tel2} onChange={handleInputChange} placeholder="+237" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="amosjames@gmail.com" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                            </div>
                            <div>
                                <Label>Role</Label>
                                <Input name="role" value={formData.role} onChange={handleInputChange} placeholder="Administrative Nurse" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                            </div>
                        </div>


                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center justify-center gap-2">
                                <Separator className='w-[150] h-[2px]' /> Security <Separator className='w-[150] h-[2px]' />
                            </h3>
                            <div className='relative'>
                                <Label>Password</Label>
                                <Input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="*******" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                                <EyeSlashIcon size={30} color="#D9D9D9" className='absolute right-2 top-1/2' />
                            </div>
                            <div className='relative'>
                                <Label>Repeat Password</Label>
                                <Input name="repeatPassword" type="password" value={formData.repeatPassword} onChange={handleInputChange} placeholder="*******" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" />
                                <EyeSlashIcon size={30} color="#D9D9D9" className='absolute right-2 top-1/2' />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleCreateUser} className="py-6 rounded-sm bg-[#028700] hover:bg-[#028700dd]">
                                Create User
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}