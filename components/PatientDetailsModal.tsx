"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  EditRowPayload,
  useEditDocumentRow,
  PatientDocument,
  ExtractedField,
  ResultsField,
  FieldCorrection
} from "../hooks/docs/useGetDoc";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./PatientsTable";
import { AlertTriangle, User, Calendar, Phone, MapPin, Stethoscope, FileText, ClipboardList } from "lucide-react";

interface PatientEditSheetProps {
  modalOpen: boolean;
  selectedPatient: PatientDocument | null;
  activeTab: string;
  setActiveTab: any;
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

const visitHistoryColumns: ColumnDef<PatientDocument>[] = [
  { id: "date", header: "Date", accessorFn: (row) => row.date },
  { id: "names", header: "Patient Name", accessorFn: (row) => row.names },
  { id: "sex", header: "Sex", accessorFn: (row) => row.sex },
  { id: "age", header: "Age", accessorFn: (row) => row.age },
  { id: "status", header: "Marital Status", accessorFn: (row) => row.status },
  { id: "pregnant", header: "is Pregnant", accessorFn: (row) => row.pregnant },
  { id: "occupation", header: "Profession", accessorFn: (row) => row.occupation },
  { id: "residence", header: "Residence", accessorFn: (row) => row.residence },
  { id: "contact", header: "Contact", accessorFn: (row) => row.contact },
  { id: "past_history", header: "History", accessorFn: (row) => row.past_history },
];

export default function PatientEditSheet({
  modalOpen,
  selectedPatient,
  activeTab,
  setActiveTab,
  closeModal,
  data,
}: PatientEditSheetProps) {
  const editMutation = useEditDocumentRow();
  const [currentTab, setCurrentTab] = React.useState<"details" | "history">("details");

  const [originalData, setOriginalData] = React.useState<FormDataType | null>(null);
  const [formData, setFormData] = React.useState<FormDataType>({
    date: "", month_number: "", case: "", names: "", sex: "", age: "",
    status: "", pregnant: "", patient_code: "", occupation: "", residence: "",
    contact: "", past_history: "", signs_symptoms: "", diagnosis: "",
    investigations: "", results: "", treatment: "", confirmatory_diagnosis: "",
    hospitalisation: "", receipt_no: "", referral: "", observations: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (selectedPatient) {
      const initialData: any = {
        date: selectedPatient.date, month_number: selectedPatient.month_number,
        case: selectedPatient.case, names: selectedPatient.names,
        sex: selectedPatient.sex, age: selectedPatient.age,
        status: selectedPatient.status, pregnant: selectedPatient.pregnant,
        patient_code: selectedPatient.patient_code, occupation: selectedPatient.occupation,
        residence: selectedPatient.residence, contact: selectedPatient.contact,
        past_history: selectedPatient.past_history, signs_symptoms: selectedPatient.signs_symptoms,
        diagnosis: selectedPatient.diagnosis, investigations: selectedPatient.investigations,
        results: selectedPatient.results, treatment: selectedPatient.treatment,
        confirmatory_diagnosis: selectedPatient.confirmatory_diagnosis,
        hospitalisation: selectedPatient.hospitalisation, receipt_no: selectedPatient.receipt_no,
        referral: selectedPatient.referral, observations: selectedPatient.observations,
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setErrors({});
      setCurrentTab("details");
    }
  }, [selectedPatient]);

  const wasFieldChanged = (field: keyof FormDataType): boolean => {
    if (!originalData) return false;
    return formData[field] !== originalData[field];
  };

  const visitHistoryData = React.useMemo(() => {
    if (!selectedPatient || !data) return [];
    const patientName = selectedPatient.names;
    const patientCode = selectedPatient.patient_code;
    return data.filter((record) => {
      const recordName = record.names;
      const recordCode = record.patient_code;
      return (patientName && recordName === patientName) || (patientCode && recordCode === patientCode);
    });
  }, [selectedPatient, data]);

  const handleChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.names.trim()) newErrors.names = "Full name is required";
    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 150)
      newErrors.age = "Valid age required (0–150)";
    if (formData.sex && !["M", "F", "Male", "Female"].includes(formData.sex.trim()))
      newErrors.sex = "Sex must be Male or Female";
    if (!formData.contact.trim()) newErrors.contact = "Contact is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createFieldCorrection = (value: string): FieldCorrection => ({
    extracted_value: value, was_corrected: true, corrected_at: new Date().toISOString(),
  });

  const createResultsCorrection = (value: string, original: ResultsField | undefined): ResultsField => ({
    value, extracted_value: value, extraction_score: original?.extraction_score ?? 0,
    corrected_score: 1, was_corrected: true, verified_at: new Date().toISOString(),
    disease_id: original?.disease_id, was_processed: original?.was_processed,
  });

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    if (!validate()) return;

    const payload: EditRowPayload = {};
    if (wasFieldChanged("date")) payload.date = createFieldCorrection(formData.date);
    if (wasFieldChanged("month_number")) payload.month_number = createFieldCorrection(formData.month_number);
    if (wasFieldChanged("case")) payload.case = createFieldCorrection(formData.case);
    if (wasFieldChanged("names")) payload.names = createFieldCorrection(formData.names.trim());
    if (wasFieldChanged("sex")) payload.sex = createFieldCorrection(formData.sex.toUpperCase().startsWith("M") ? "M" : "F");
    if (wasFieldChanged("age")) payload.age = createFieldCorrection(formData.age);
    if (wasFieldChanged("status")) payload.status = createFieldCorrection(formData.status);
    if (wasFieldChanged("pregnant")) payload.pregnant = createFieldCorrection(formData.pregnant === "Yes" || formData.pregnant === "1" ? "1" : "2");
    if (wasFieldChanged("patient_code")) payload.patient_code = createFieldCorrection(formData.patient_code);
    if (wasFieldChanged("occupation")) payload.occupation = createFieldCorrection(formData.occupation);
    if (wasFieldChanged("residence")) payload.residence = createFieldCorrection(formData.residence);
    if (wasFieldChanged("contact")) payload.contact = createFieldCorrection(formData.contact);
    if (wasFieldChanged("past_history")) payload.past_history = createFieldCorrection(formData.past_history);
    if (wasFieldChanged("signs_symptoms")) payload.signs_symptoms = createFieldCorrection(formData.signs_symptoms);
    if (wasFieldChanged("diagnosis")) payload.diagnosis = createFieldCorrection(formData.diagnosis);
    if (wasFieldChanged("investigations")) payload.investigations = createFieldCorrection(formData.investigations);
    if (wasFieldChanged("results")) payload.results = createResultsCorrection(formData.results, selectedPatient.results);
    if (wasFieldChanged("treatment")) payload.treatment = createFieldCorrection(formData.treatment);
    if (wasFieldChanged("confirmatory_diagnosis")) payload.confirmatory_diagnosis = createFieldCorrection(formData.confirmatory_diagnosis);
    if (wasFieldChanged("hospitalisation")) payload.hospitalisation = createFieldCorrection(formData.hospitalisation);
    if (wasFieldChanged("receipt_no")) payload.receipt_no = createFieldCorrection(formData.receipt_no);
    if (wasFieldChanged("referral")) payload.referral = createFieldCorrection(formData.referral);
    if (wasFieldChanged("observations")) payload.observations = createFieldCorrection(formData.observations);

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save");
      return;
    }

    editMutation.mutate(
      { doc_code: selectedPatient.doc_code, row_id: selectedPatient._id, payload },
      {
        onSuccess: () => { toast.success("Patient record updated successfully!"); closeModal(); },
        onError: (error: any) => { toast.error(error.message || "Failed to update record"); },
      }
    );
  };

  const handleOpenChange = (open: boolean) => { if (!open) closeModal(); };
  const handleMarkDeceased = () => { toast.info("Mark as deceased functionality"); };

  if (!selectedPatient) return null;

  const inputClass = "h-11 bg-white border border-gray-200 rounded-lg px-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400";
  const selectTriggerClass = "h-11 bg-white border border-gray-200 rounded-lg px-4 focus:ring-1 focus:ring-blue-500";
  const labelClass = "text-sm font-medium text-gray-700 mb-1.5 block";
  const sectionClass = "bg-gray-50 rounded-xl p-6 space-y-5";
  const sectionTitleClass = "flex items-center gap-2 text-base font-semibold text-gray-800 mb-4";

  return (
    <Sheet open={modalOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0 overflow-hidden flex flex-col bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{formData.names || "Patient Details"}</h2>
              <p className="text-sm text-gray-500">Patient Code: {formData.patient_code || "N/A"}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentTab("details")}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                currentTab === "details"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Patient Details
            </button>
            <button
              onClick={() => setCurrentTab("history")}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                currentTab === "history"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Visit History ({visitHistoryData.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-28">
          {currentTab === "details" && (
            <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
              {/* Personal Information */}
              <div className={sectionClass}>
                <div className={sectionTitleClass}>
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="lg:col-span-2">
                    <Label className={labelClass}>Full Name *</Label>
                    <Input value={formData.names} onChange={(e: any) => handleChange("names", e.target.value)} className={inputClass} placeholder="Enter full name" />
                    {errors.names && <p className="text-red-500 text-xs mt-1">{errors.names}</p>}
                  </div>
                  <div>
                    <Label className={labelClass}>Age *</Label>
                    <Input type="number" value={formData.age} onChange={(e: any) => handleChange("age", e.target.value)} className={inputClass} placeholder="Age" />
                    {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                  </div>
                  <div>
                    <Label className={labelClass}>Sex *</Label>
                    <Select value={formData.sex} onValueChange={(v) => handleChange("sex", v)}>
                      <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClass}>Marital Status</Label>
                    <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                      <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CE - single">Single</SelectItem>
                        <SelectItem value="M">Married</SelectItem>
                        <SelectItem value="DI">Divorced</SelectItem>
                        <SelectItem value="W">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClass}>Is Pregnant</Label>
                    <Select value={formData.pregnant === "1" || formData.pregnant === "yes" ? "yes" : "no"} onValueChange={(v) => handleChange("pregnant", v === "yes" ? "1" : "0")}>
                      <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClass}>Profession</Label>
                    <Input value={formData.occupation} onChange={(e: any) => handleChange("occupation", e.target.value)} className={inputClass} placeholder="Enter profession" />
                  </div>
                  <div>
                    <Label className={labelClass}>Patient Code</Label>
                    <Input value={formData.patient_code} onChange={(e: any) => handleChange("patient_code", e.target.value)} className={inputClass} placeholder="Patient code" />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Phone className="w-5 h-5 text-blue-600" />
                  Contact Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <Label className={labelClass}>Contact *</Label>
                    <Input value={formData.contact} onChange={(e: any) => handleChange("contact", e.target.value)} className={inputClass} placeholder="Phone number" />
                    {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                  </div>
                  <div className="lg:col-span-2">
                    <Label className={labelClass}>Residence</Label>
                    <Input value={formData.residence} onChange={(e: any) => handleChange("residence", e.target.value)} className={inputClass} placeholder="Address" />
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Visit Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <Label className={labelClass}>Date</Label>
                    <Input type="date" value={formData.date} onChange={(e: any) => handleChange("date", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <Label className={labelClass}>Hospitalisation</Label>
                    <Select value={formData.hospitalisation} onValueChange={(v) => handleChange("hospitalisation", v)}>
                      <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelClass}>Receipt No</Label>
                    <Input value={formData.receipt_no} onChange={(e: any) => handleChange("receipt_no", e.target.value)} className={inputClass} placeholder="Receipt number" />
                  </div>
                  <div>
                    <Label className={labelClass}>Referral</Label>
                    <Input value={formData.referral} onChange={(e: any) => handleChange("referral", e.target.value)} className={inputClass} placeholder="Referral info" />
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className={sectionClass}>
                <div className={sectionTitleClass}>
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  Medical History
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className={labelClass}>Past History</Label>
                    <Input value={formData.past_history} onChange={(e: any) => handleChange("past_history", e.target.value)} className={inputClass} placeholder="Enter past medical history" />
                  </div>
                  <div>
                    <Label className={labelClass}>Signs & Symptoms</Label>
                    <Input value={formData.signs_symptoms} onChange={(e: any) => handleChange("signs_symptoms", e.target.value)} className={inputClass} placeholder="Enter signs and symptoms" />
                  </div>
                </div>
              </div>

              {/* Diagnosis & Treatment */}
              <div className={sectionClass}>
                <div className={sectionTitleClass}>
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  Diagnosis & Treatment
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className={labelClass}>Diagnosis</Label>
                    <Input value={formData.diagnosis} onChange={(e: any) => handleChange("diagnosis", e.target.value)} className={inputClass} placeholder="Enter diagnosis" />
                  </div>
                  <div>
                    <Label className={labelClass}>Confirmatory Diagnosis</Label>
                    <Input value={formData.confirmatory_diagnosis} onChange={(e: any) => handleChange("confirmatory_diagnosis", e.target.value)} className={inputClass} placeholder="Confirmatory diagnosis" />
                  </div>
                  <div>
                    <Label className={labelClass}>Investigations</Label>
                    <Input value={formData.investigations} onChange={(e: any) => handleChange("investigations", e.target.value)} className={inputClass} placeholder="Enter investigations" />
                  </div>
                  <div>
                    <Label className={labelClass}>Results</Label>
                    <Input value={formData.results} onChange={(e: any) => handleChange("results", e.target.value)} className={inputClass} placeholder="Enter results" />
                  </div>
                  <div>
                    <Label className={labelClass}>Treatment</Label>
                    <Input value={formData.treatment} onChange={(e: any) => handleChange("treatment", e.target.value)} className={inputClass} placeholder="Enter treatment" />
                  </div>
                  <div>
                    <Label className={labelClass}>Observations</Label>
                    <Input value={formData.observations} onChange={(e: any) => handleChange("observations", e.target.value)} className={inputClass} placeholder="Enter observations" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === "history" && (
            <div className="px-6 py-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <DataTable data={visitHistoryData} columns={visitHistoryColumns} isLoading={false} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shadow-lg">
          <Button variant="outline" onClick={handleMarkDeceased} className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Mark Deceased
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeModal} className="px-6">Cancel</Button>
            <Button onClick={handleSubmit} disabled={editMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              {editMutation.isPending ? "Saving..." : "Update Record"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}