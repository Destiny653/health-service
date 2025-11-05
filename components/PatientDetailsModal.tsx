import * as React from "react";
import { format } from 'date-fns';
import { Patient } from "@/hooks/usePatients";
import { DataTable } from "@/components/PatientsTable";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface PatientDetailsModalProps {
  modalOpen: boolean;
  selectedPatient: Patient | null;
  activeTab: 'details' | 'history';
  setActiveTab: (tab: 'details' | 'history') => void;
  closeModal: () => void;
  data: Patient[];
}

export default function PatientDetailsModal({
  modalOpen,
  selectedPatient,
  activeTab,
  setActiveTab,
  closeModal,
  data,
}: PatientDetailsModalProps) {
  if (!modalOpen || !selectedPatient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black -top-6 bg-opacity-50">
      <div className="w-full h-[90vh] transform transition-transform duration-300 ease-in-out translate-y-0">
        <Card className="h-full p-0 m-0 bg-white rounded-none border-0 shadow-none">
          <CardHeader className="p-0 mb-4 border-b">
            <div className="flex  items-center p-0">
              <div className="flex w-full px-2">
                <Button
                  size="sm"
                  onClick={() => setActiveTab('details')}
                  className={`${activeTab === 'details' ? 'border-[#021EF5] border-b-2 text-[#021EF5]' : 'text-black'} rounded-none shadow-none font-semibold bg-inherit hover:bg-gray-100 py-6`}
                >
                  Patient Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('history')}
                  className={`${activeTab === 'history' ? 'border-[#021EF5] border-b-2 text-[#021EF5]' : 'text-black'} rounded-none shadow-none font-semibold py-6 bg-inherit hover:bg-gray-100`}
                >
                  Visit History
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 mx-auto overflow-y-auto pb-20 h-full w- py-4 rounded-md">
            {activeTab === 'details' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6" defaultValue={selectedPatient.patientName} />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" type="number" defaultValue={selectedPatient.age} />
                  </div>
                  <div>
                    <Label htmlFor="sex">Sex</Label>
                    <Select defaultValue={selectedPatient.sex}>
                      <SelectTrigger className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select defaultValue={selectedPatient.maritalStatus}>
                      <SelectTrigger className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DI">Divorced</SelectItem>
                        <SelectItem value="MP">Married</SelectItem>
                        <SelectItem value="MM">Single</SelectItem>
                        <SelectItem value="CE">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="isPregnant">Is Pregnant</Label>
                    <Select defaultValue={selectedPatient.isPregnant.toString()}>
                      <SelectTrigger className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Yes</SelectItem>
                        <SelectItem value="2">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profession">Profession</Label>
                    <Input id="profession" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" defaultValue={selectedPatient.profession} />
                  </div>
                  <div>
                    <Label htmlFor="residence">Residence</Label>
                    <Input id="residence" className="rounded-sm  bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" defaultValue={selectedPatient.residence} />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact</Label>
                    <Input id="contact" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" defaultValue={selectedPatient.contact} />
                  </div>
                  <div>
                    <Label htmlFor="history">History</Label>
                    <Input id="history" className="rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0  active:border-b-2 border-b-2 focus:border-[#028700] shadow-none py-6 focus:outline-none" defaultValue={selectedPatient.history} />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'history' && (
              <DataTable
                data={data.filter(p => p.patientName === selectedPatient.patientName)}
                columns={[
                  { accessorKey: "createdAt", header: "Date", cell: ({ getValue }) => format(getValue() as Date, 'yyyy-MM-dd') },
                  { accessorKey: "patientName", header: "Patient Name" },
                  { accessorKey: "sex", header: "Sex" },
                  { accessorKey: "age", header: "Age" },
                  { accessorKey: "maritalStatus", header: "Marital Status" },
                  { accessorKey: "isPregnant", header: "Is Pregnant" },
                  { accessorKey: "profession", header: "Profession" },
                  { accessorKey: "residence", header: "Residence" },
                  { accessorKey: "contact", header: "Contact" },
                  { accessorKey: "history", header: "History" },
                ]}
                isLoading={false}
              />
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t flex justify-between">
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 rounded-sm">
              Deceased
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 rounded-sm">
              Update Record
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
