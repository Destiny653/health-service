"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  EditRowPayload,
  useEditDocumentRow,
  PatientDocument,
} from "../hooks/docs/useGetDoc";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./PatientsTable";
import { AlertTriangle } from "lucide-react";

// EXACT input style from your design
const inputBaseClass =
  "rounded-none shadow-none py-4 px-5 border-b-2 border-x-0 border-t-0 bg-blue-50 focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-auto";

const getInputClass = (hasError = false) =>
  `${inputBaseClass} ${hasError ? "border-red-500" : "border-gray-300 focus:border-b-[#04b301]"}`;

const selectTriggerClass = `${inputBaseClass} border-gray-300 focus:border-b-[#04b301] data-[state=open]:border-b-[#04b301]`;

const visitHistoryColumns: ColumnDef<PatientDocument>[] = [
  { id: "date", header: "Date", accessorFn: (row) => row.date?.value || "" },
  { id: "names", header: "Patient Name", accessorFn: (row) => row.names?.value || "" },
  { id: "sex", header: "Sex", accessorFn: (row) => row.sex?.value || "" },
  { id: "age", header: "Age", accessorFn: (row) => row.age?.value || "" },
  { id: "status", header: "Marital Status", accessorFn: (row) => row.status?.value || "" },
  { id: "pregnant", header: "is Pregnant", accessorFn: (row) => (row.pregnant?.value === "1" ? "Yes" : "No") },
  { id: "occupation", header: "Profession", accessorFn: (row) => row.occupation?.value || "" },
  { id: "residence", header: "Residence", accessorFn: (row) => row.residence?.value || "" },
  { id: "contact", header: "Contact", accessorFn: (row) => row.contact?.value || "" },
  { id: "past_history", header: "History", accessorFn: (row) => row.past_history?.value || "" },
];

interface PatientEditSheetProps {
  modalOpen: boolean;
  selectedPatient: PatientDocument | null;
  closeModal: () => void;
  data: PatientDocument[];
}

interface FormDataType {
  date: string;
  month_number: string;
  case: string;
  names: string;
  sex: string;
  age: string;
  status: string;
  pregnant: string;
  patient_code: string;
  occupation: string;
  residence: string;
  contact: string;
  past_history: string;
  signs_symptoms: string;
  diagnosis: string;
  investigations: string;
  results: string;
  treatment: string;
  confirmatory_diagnosis: string;
  hospitalisation: string;
  receipt_no: string;
  referral: string;
  observations: string;
}

export default function PatientEditSheet({
  modalOpen,
  selectedPatient,
  closeModal,
  data,
}: PatientEditSheetProps) {
  const editMutation = useEditDocumentRow();
  const [currentTab, setCurrentTab] = React.useState<"details" | "history">("details");

  const [formData, setFormData] = React.useState<FormDataType>({
    date: "", month_number: "", case: "", names: "", sex: "", age: "", status: "", pregnant: "",
    patient_code: "", occupation: "", residence: "", contact: "", past_history: "",
    signs_symptoms: "", diagnosis: "", investigations: "", results: "", treatment: "",
    confirmatory_diagnosis: "", hospitalisation: "", receipt_no: "", referral: "", observations: ""
  });

  const [originalData, setOriginalData] = React.useState<FormDataType | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (selectedPatient) {
      const p = selectedPatient;

      const mapped: FormDataType = {
        date: p.date?.value || "",
        month_number: p.month_number?.value?.toString() || "",
        case: p.case?.value?.toString() || "",
        names: p.names?.value || "",
        sex: p.sex?.value || "",
        age: p.age?.value?.toString() || "",
        status: p.status?.value || "",
        pregnant: p.pregnant?.value === "1" ? "yes" : "no",
        patient_code: p.patient_code?.value || "",
        occupation: p.occupation?.value || "",
        residence: p.residence?.value || "",
        contact: p.contact?.value || "",
        past_history: p.past_history?.value || "",
        signs_symptoms: p.signs_symptoms?.value || "",
        diagnosis: p.diagnosis?.value || "",
        investigations: p.investigations?.value || "",
        results: (p.results as any)?.value || p.results?.value || "",
        treatment: p.treatment?.value || "",
        confirmatory_diagnosis: p.confirmatory_diagnosis?.value || "",
        hospitalisation: p.hospitalisation?.value || "",
        receipt_no: p.receipt_no?.value || "",
        referral: p.referral?.value || "",
        observations: p.observations?.value || "",
      };

      setFormData(mapped);
      setOriginalData(mapped);
      setErrors({});
      setCurrentTab("details");
    }
  }, [selectedPatient]);

  const visitHistoryData = React.useMemo(() => {
    if (!selectedPatient || !data) return [];
    const name = selectedPatient.names?.value;
    const code = selectedPatient.patient_code?.value;
    return data.filter(r => 
      r.names?.value === name || r.patient_code?.value === code
    );
  }, [selectedPatient, data]);

  const handleChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = () => {
    toast.success("Record updated!");
    closeModal();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) closeModal();
  };

  if (!selectedPatient) return null;

  return (
    <Sheet open={modalOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 overflow-y-auto bg-gray-50">
        {/* Tabs + Close Button */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="mx-auto px-6 relative">
            <div className="flex gap-12 border-b">
              <button
                onClick={() => setCurrentTab("details")}
                className={`py-6 px-1 text-sm font-medium transition-all relative ${currentTab === "details" ? "text-green-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                Patient Details
                {currentTab === "details" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                )}
              </button>
              <button
                onClick={() => setCurrentTab("history")}
                className={`py-6 px-1 text-sm font-medium transition-all relative ${currentTab === "history" ? "text-green-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                Visit History
                {currentTab === "history" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                )}
              </button>
            </div>

            {/* Close X Button */}
            <button
              onClick={closeModal}
              className="p-2 rounded-full absolute top-1/4 right-4 hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto px-6 py-8">
          {currentTab === "details" && (
            <div className="space-y-10 max-w-7xl mx-auto">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</Label>
                  <Input value={formData.names} onChange={e => handleChange("names", e.target.value)} className={getInputClass(!!errors.names)} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Age</Label>
                  <Input value={formData.age} onChange={e => handleChange("age", e.target.value)} className={getInputClass(!!errors.age)} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Sex</Label>
                  <Select value={formData.sex} onValueChange={v => handleChange("sex", v)}>
                    <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="M">M</SelectItem><SelectItem value="F">F</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Marital Status</Label>
                  <Input value={formData.status} onChange={e => handleChange("status", e.target.value)} className={getInputClass()} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Is Pregnant</Label>
                  <Select value={formData.pregnant} onValueChange={v => handleChange("pregnant", v)}>
                    <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">yes</SelectItem><SelectItem value="no">no</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Profession</Label>
                  <Input value={formData.occupation} onChange={e => handleChange("occupation", e.target.value)} className={getInputClass()} />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Residence</Label>
                  <Input value={formData.residence} onChange={e => handleChange("residence", e.target.value)} className={getInputClass()} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Contact</Label>
                  <Input value={formData.contact} onChange={e => handleChange("contact", e.target.value)} className={getInputClass()} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Patient Code</Label>
                  <Input value={formData.patient_code} onChange={e => handleChange("patient_code", e.target.value)} className={getInputClass()} />
                </div>
              </div>

              {/* Medical Fields */}
              <div className="space-y-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Past History</Label><Input value={formData.past_history} onChange={e => handleChange("past_history", e.target.value)} className={getInputClass()} /></div>
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Signs & Symptoms</Label><Input value={formData.signs_symptoms} onChange={e => handleChange("signs_symptoms", e.target.value)} className={getInputClass()} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Diagnosis</Label><Input value={formData.diagnosis} onChange={e => handleChange("diagnosis", e.target.value)} className={getInputClass()} /></div>
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Confirmatory Diagnosis</Label><Input value={formData.confirmatory_diagnosis} onChange={e => handleChange("confirmatory_diagnosis", e.target.value)} className={getInputClass()} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Investigations</Label><Input value={formData.investigations} onChange={e => handleChange("investigations", e.target.value)} className={getInputClass()} /></div>
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Results</Label><Input value={formData.results} onChange={e => handleChange("results", e.target.value)} className={getInputClass()} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Treatment</Label><Input value={formData.treatment} onChange={e => handleChange("treatment", e.target.value)} className={getInputClass()} /></div>
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Observations</Label><Input value={formData.observations} onChange={e => handleChange("observations", e.target.value)} className={getInputClass()} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Date</Label><Input type="date" value={formData.date} onChange={e => handleChange("date", e.target.value)} className={getInputClass()} /></div>
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Hospitalisation</Label><Input value={formData.hospitalisation} onChange={e => handleChange("hospitalisation", e.target.value)} className={getInputClass()} /></div>
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Receipt No</Label><Input value={formData.receipt_no} onChange={e => handleChange("receipt_no", e.target.value)} className={getInputClass()} /></div>
                  <div><Label className="text-sm font-medium text-gray-700 mb-2 block">Referral</Label><Input value={formData.referral} onChange={e => handleChange("referral", e.target.value)} className={getInputClass()} /></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-10 border-t border-gray-200 mt-12">
                <Button variant="destructive" className="flex items-center gap-3 py-6 text-lg font-medium">
                  <AlertTriangle className="w-6 h-6" />
                  Deceased
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 text-lg font-medium" onClick={handleSubmit}>
                  Update Record
                </Button>
              </div>
            </div>
          )}

          {currentTab === "history" && (
            <div className="bg-white shadow-sm border overflow-auto rounded-lg">
              <DataTable data={visitHistoryData} columns={visitHistoryColumns} isLoading={false} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}