import * as React from "react";
import { useState } from "react";
import { format } from 'date-fns';
import { Patient } from "@/hooks/usePatients";
import { DataTable } from "@/components/PatientsTable";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Optional: for toast notifications
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";

interface PatientDetailsModalProps {
  modalOpen: boolean;
  selectedPatient: Patient | null;
  activeTab: 'details' | 'history';
  setActiveTab: (tab: 'details' | 'history') => void;
  closeModal: () => void;
  data: Patient[];
  onUpdatePatient?: (updatedPatient: Patient) => void; // Callback to update parent
}

export default function PatientDetailsModal({
  modalOpen,
  selectedPatient,
  activeTab,
  setActiveTab,
  closeModal,
  data,
  onUpdatePatient,
}: PatientDetailsModalProps) {


  // Form state
  const [formData, setFormData] = useState<Partial<Patient>>({
    patientName: selectedPatient?.patientName,
    age: selectedPatient?.age,
    sex: selectedPatient?.sex,
    maritalStatus: selectedPatient?.maritalStatus,
    isPregnant: selectedPatient?.isPregnant,
    profession: selectedPatient?.profession || '',
    residence: selectedPatient?.residence || '',
    contact: selectedPatient?.contact || '',
    history: selectedPatient?.history || '',
  });

  React.useEffect(() => {
  if (selectedPatient) {
    setFormData({
      patientName: selectedPatient.patientName,
      age: selectedPatient.age,
      sex: selectedPatient.sex,
      maritalStatus: selectedPatient.maritalStatus,
      isPregnant: selectedPatient.isPregnant,
      profession: selectedPatient.profession || '',
      residence: selectedPatient.residence || '',
      contact: selectedPatient.contact || '',
      history: selectedPatient.history || '',
    });
  }
}, [selectedPatient]);


  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = (field: keyof Patient, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientName?.trim()) newErrors.patientName = "Full name is required";
    if (!formData.age || formData.age < 0 || formData.age > 150) newErrors.age = "Valid age required";
    if (!formData.sex) newErrors.sex = "Sex is required";
    if (!formData.maritalStatus) newErrors.maritalStatus = "Marital status is required";
    if (!formData.contact?.trim()) newErrors.contact = "Contact is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (selectedPatient) {
        const updatedPatient: Patient = {
          ...selectedPatient,
          ...formData,
          age: Number(formData.age),
          isPregnant: Number(formData.isPregnant) as 0 | 1,
        };

        onUpdatePatient && onUpdatePatient(updatedPatient);
      }
      toast.success("Patient record updated successfully!");
      closeModal();
    } catch (error) {
      toast.error("Failed to update patient record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic border class based on error/focus
  const getBorderClass = (field: string) => {
    const base = "bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 transition-all duration-200";
    if (errors[field]) return `${base} border-b-red-500 focus:border-b-red-500`;
    return `${base} focus:border-b-[#028700]`;
  };

  return (
    <Sheet open={modalOpen} onOpenChange={closeModal}>
      <SheetTitle></SheetTitle>
      <SheetContent side='bottom' className="h-[90vh] p-0">
        <Card className="h-full p-0 m-0 bg-white rounded-none border-0 shadow-none">
          <CardHeader className="p-0 mb-4 border-b">
            <div className="flex items-center p-0">
              <div className="flex w-full px-2">
                <Button
                  size="sm"
                  onClick={() => setActiveTab('details')}
                  className={`text-lg ${activeTab === 'details' ? 'border-[#028700] border-b-2 text-[#028700]' : 'text-black'} rounded-none shadow-none font-semibold bg-inherit hover:bg-gray-100 py-6`}
                >
                  Patient Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('history')}
                  className={`text-lg ${activeTab === 'history' ? 'border-[#028700]  border-b-2 text-[#028700]' : 'text-black'} rounded-none shadow-none font-semibold py-6 bg-inherit hover:bg-gray-100`}
                >
                  Visit History
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 mx-auto overflow-y-auto h-full w-full py-4 pb-[180px] rounded-md">
            {activeTab === 'details' && selectedPatient && (
              <div className="space-y-4 max-w-5xl mx-auto text-[16px]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      value={formData.patientName || ''}
                      onChange={(e) => handleInputChange('patientName', e.target.value)}
                      className={getBorderClass('patientName')}
                      placeholder="Enter full name"
                    />
                    {errors.patientName && <p className="text-red-500 text-sm mt-1">{errors.patientName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                      className={getBorderClass('age')}
                    />
                    {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                  </div>

                  <div>
                    <Label htmlFor="sex">Sex</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={(value) => handleInputChange('sex', value)}
                    >
                      <SelectTrigger className={getBorderClass('sex')}>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.sex && <p className="text-red-500 text-sm mt-1">{errors.sex}</p>}
                  </div>

                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) => handleInputChange('maritalStatus', value)}
                    >
                      <SelectTrigger className={getBorderClass('maritalStatus')}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MA">Married</SelectItem>
                        <SelectItem value="SI">Single</SelectItem>
                        <SelectItem value="DI">Divorced</SelectItem>
                        <SelectItem value="WI">Widowed</SelectItem>
                        <SelectItem value="MP">Married (Polygamous)</SelectItem>
                        <SelectItem value="MM">Single (Monogamous)</SelectItem>
                        <SelectItem value="CE">Celibate</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.maritalStatus && <p className="text-red-500 text-sm mt-1">{errors.maritalStatus}</p>}
                  </div>

                  <div>
                    <Label htmlFor="isPregnant">Is Pregnant</Label>
                    <Select
                      value={formData.isPregnant?.toString()}
                      onValueChange={(value) => handleInputChange('isPregnant', parseInt(value) as 0 | 1)}
                    >
                      <SelectTrigger className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Yes</SelectItem>
                        <SelectItem value="0">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="profession">Profession</Label>
                    <Input
                      id="profession"
                      value={formData.profession || ''}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="residence">Residence</Label>
                    <Input
                      id="residence"
                      value={formData.residence || ''}
                      onChange={(e) => handleInputChange('residence', e.target.value)}
                      className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact">Contact</Label>
                    <Input
                      id="contact"
                      value={formData.contact || ''}
                      onChange={(e) => handleInputChange('contact', e.target.value)}
                      className={getBorderClass('contact')}
                    />
                    {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="history">History</Label>
                    <Input
                      id="history"
                      value={formData.history || ''}
                      onChange={(e) => handleInputChange('history', e.target.value)}
                      className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6"
                    />
                  </div>

                  {/* Read-only fields remain unchanged */}
                  {selectedPatient.symptoms && (
                    <div className="col-span-2">
                      <Label>Symptoms</Label>
                      <Input defaultValue={selectedPatient.symptoms.join(', ')} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.diagnosisPrescribing && (
                    <div className="col-span-2">
                      <Label>Diagnosis / Prescribing</Label>
                      <Input defaultValue={selectedPatient.diagnosisPrescribing} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.testsRequested && (
                    <div className="col-span-2">
                      <Label>Tests Requested</Label>
                      <Input defaultValue={selectedPatient.testsRequested.join(', ')} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.confirmedResults && (
                    <div className="col-span-2">
                      <Label>Confirmed Results</Label>
                      <Input defaultValue={selectedPatient.confirmedResults.join(', ')} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.confirmatoryDiagnosis && (
                    <div className="col-span-2">
                      <Label>Confirmatory Diagnosis</Label>
                      <Input defaultValue={selectedPatient.confirmatoryDiagnosis} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.treatment && (
                    <div className="col-span-2">
                      <Label>Treatment</Label>
                      <Input defaultValue={selectedPatient.treatment.join(', ')} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.careLevel && (
                    <div>
                      <Label>Care Level</Label>
                      <Input defaultValue={selectedPatient.careLevel} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.referenceHospital && (
                    <div>
                      <Label>Reference Hospital</Label>
                      <Input defaultValue={selectedPatient.referenceHospital} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.receiptNumber && (
                    <div>
                      <Label>Receipt Number</Label>
                      <Input defaultValue={selectedPatient.receiptNumber} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.observations && (
                    <div className="col-span-2">
                      <Label>Observations</Label>
                      <Input defaultValue={selectedPatient.observations} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.dataIssues && (
                    <div className="col-span-2">
                      <Label>Data Issues</Label>
                      <Input defaultValue={selectedPatient.dataIssues.join(', ')} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}

                  {selectedPatient.role && (
                    <div>
                      <Label>Role</Label>
                      <Input defaultValue={selectedPatient.role} readOnly className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 focus:border-[#028700] py-6" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <DataTable
                data={data.filter(p => p.patientName === selectedPatient?.patientName)}
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
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 rounded-sm disabled:opacity-70"
            >
              {isSubmitting ? "Updating..." : "Update Record"}
            </Button>
          </div>
        </Card>
      </SheetContent>
    </Sheet>
  );
}