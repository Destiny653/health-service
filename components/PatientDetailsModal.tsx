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
} from "./team/hooks/docs/useGetDoc";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./PatientsTable";
import { Textarea } from "./ui/textarea";
import { AlertTriangle } from "lucide-react";

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

// Helper to safely get extracted_value from ExtractedField
const getExtractedValue = (field: ExtractedField | undefined | null): string => {
  return field?.extracted_value ?? field?.value ?? "";
};

// Helper to safely get extracted_value from ResultsField
const getResultsValue = (field: ResultsField | undefined | null): string => {
  return field?.extracted_value ?? field?.value ?? "";
};

// Visit History table columns
const visitHistoryColumns: ColumnDef<PatientDocument>[] = [
  {
    id: "date",
    header: "Date",
    accessorFn: (row) => row.date?.extracted_value || row.date?.value || "—",
  },
  {
    id: "names",
    header: "Patient Name",
    accessorFn: (row) => row.names?.extracted_value || row.names?.value || "—",
  },
  {
    id: "sex",
    header: "Sex",
    accessorFn: (row) => row.sex?.extracted_value || row.sex?.value || "—",
  },
  {
    id: "age",
    header: "Age",
    accessorFn: (row) => row.age?.extracted_value || row.age?.value || "—",
  },
  {
    id: "status",
    header: "Marital Status",
    accessorFn: (row) => row.status?.extracted_value || row.status?.value || "—",
  },
  {
    id: "pregnant",
    header: "is Pregnant",
    accessorFn: (row) => {
      const val = row.pregnant?.extracted_value || row.pregnant?.value || "";
      return val === "1" || val.toLowerCase() === "yes" ? "1" : "0";
    },
  },
  {
    id: "occupation",
    header: "Profession",
    accessorFn: (row) => row.occupation?.extracted_value || row.occupation?.value || "—",
  },
  {
    id: "residence",
    header: "Residence",
    accessorFn: (row) => row.residence?.extracted_value || row.residence?.value || "—",
  },
  {
    id: "contact",
    header: "Contact",
    accessorFn: (row) => row.contact?.extracted_value || row.contact?.value || "—",
  },
  {
    id: "past_history",
    header: "History",
    accessorFn: (row) => row.past_history?.extracted_value || row.past_history?.value || "—",
  },
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

  // Store original values to track changes
  const [originalData, setOriginalData] = React.useState<FormDataType | null>(null);

  const [formData, setFormData] = React.useState<FormDataType>({
    date: "",
    month_number: "",
    case: "",
    names: "",
    sex: "",
    age: "",
    status: "",
    pregnant: "",
    patient_code: "",
    occupation: "",
    residence: "",
    contact: "",
    past_history: "",
    signs_symptoms: "",
    diagnosis: "",
    investigations: "",
    results: "",
    treatment: "",
    confirmatory_diagnosis: "",
    hospitalisation: "",
    receipt_no: "",
    referral: "",
    observations: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Sync form when selectedPatient changes
  React.useEffect(() => {
    if (selectedPatient) {
      const initialData: FormDataType = {
        date: getExtractedValue(selectedPatient.date),
        month_number: getExtractedValue(selectedPatient.month_number),
        case: getExtractedValue(selectedPatient.case),
        names: getExtractedValue(selectedPatient.names),
        sex: getExtractedValue(selectedPatient.sex),
        age: getExtractedValue(selectedPatient.age),
        status: getExtractedValue(selectedPatient.status),
        pregnant: getExtractedValue(selectedPatient.pregnant),
        patient_code: getExtractedValue(selectedPatient.patient_code),
        occupation: getExtractedValue(selectedPatient.occupation),
        residence: getExtractedValue(selectedPatient.residence),
        contact: getExtractedValue(selectedPatient.contact),
        past_history: getExtractedValue(selectedPatient.past_history),
        signs_symptoms: getExtractedValue(selectedPatient.signs_symptoms),
        diagnosis: getExtractedValue(selectedPatient.diagnosis),
        investigations: getExtractedValue(selectedPatient.investigations),
        results: getResultsValue(selectedPatient.results),
        treatment: getExtractedValue(selectedPatient.treatment),
        confirmatory_diagnosis: getExtractedValue(selectedPatient.confirmatory_diagnosis),
        hospitalisation: getExtractedValue(selectedPatient.hospitalisation),
        receipt_no: getExtractedValue(selectedPatient.receipt_no),
        referral: getExtractedValue(selectedPatient.referral),
        observations: getExtractedValue(selectedPatient.observations),
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setErrors({});
      setCurrentTab("details");
    }
  }, [selectedPatient]);

  // Check if a field was changed
  const wasFieldChanged = (field: keyof FormDataType): boolean => {
    if (!originalData) return false;
    return formData[field] !== originalData[field];
  };

  // Get visit history data for the selected patient
  const visitHistoryData = React.useMemo(() => {
    if (!selectedPatient || !data) return [];
    // Filter data to show records with the same patient name or patient_code
    const patientName = selectedPatient.names?.extracted_value || selectedPatient.names?.value;
    const patientCode = selectedPatient.patient_code?.extracted_value || selectedPatient.patient_code?.value;
    
    return data.filter((record) => {
      const recordName = record.names?.extracted_value || record.names?.value;
      const recordCode = record.patient_code?.extracted_value || record.patient_code?.value;
      return (patientName && recordName === patientName) || (patientCode && recordCode === patientCode);
    });
  }, [selectedPatient, data]);

  const handleChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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

  // Create FieldCorrection only for changed fields
  const createFieldCorrection = (value: string): FieldCorrection => ({
    extracted_value: value,
    was_corrected: true,
    corrected_at: new Date().toISOString(),
  });

  // Create ResultsField correction
  const createResultsCorrection = (value: string, original: ResultsField | undefined): ResultsField => ({
    value: value,
    extracted_value: value,
    extraction_score: original?.extraction_score ?? 0,
    corrected_score: 1,
    was_corrected: true,
    verified_at: new Date().toISOString(),
    disease_id: original?.disease_id,
    was_processed: original?.was_processed,
  });

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    if (!validate()) return;

    // Build payload with only changed fields
    const payload: EditRowPayload = {};

    if (wasFieldChanged("date")) payload.date = createFieldCorrection(formData.date);
    if (wasFieldChanged("month_number")) payload.month_number = createFieldCorrection(formData.month_number);
    if (wasFieldChanged("case")) payload.case = createFieldCorrection(formData.case);
    if (wasFieldChanged("names")) payload.names = createFieldCorrection(formData.names.trim());
    if (wasFieldChanged("sex")) payload.sex = createFieldCorrection(formData.sex.toUpperCase().startsWith("Male") ? "Male" : "Female");
    if (wasFieldChanged("age")) payload.age = createFieldCorrection(formData.age);
    if (wasFieldChanged("status")) payload.status = createFieldCorrection(formData.status);
    if (wasFieldChanged("pregnant")) payload.pregnant = createFieldCorrection(formData.pregnant === "Yes" || formData.pregnant === "1" ? "1" : "0");
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

    // Check if any fields were changed
    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save");
      return;
    }

    editMutation.mutate(
      {
        doc_code: selectedPatient.metadata?.doc_code,
        row_id: selectedPatient._id,
        payload,
      },
      {
        onSuccess: () => {
          toast.success("Patient record updated successfully!");
          closeModal();
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to update record");
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) closeModal();
  };

  const handleMarkDeceased = () => {
    // Handle deceased marking logic
    toast.info("Mark as deceased functionality");
  };

  if (!selectedPatient) return null;

  const inputClass = "bg-[#F8FAFC] border-0 border-b border-gray-200 rounded-none px-3 py-3 focus:border-b-2 focus:border-[#028700] focus:ring-0 placeholder:text-gray-400";
  const selectTriggerClass = "bg-[#F8FAFC] border-0 border-b border-gray-200 rounded-none px-3 py-3 h-auto focus:ring-0";

  return (
    <Sheet open={modalOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Tabs Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex">
            <button
              onClick={() => setCurrentTab("details")}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                currentTab === "details"
                  ? "text-[#2563EB]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Patient Details
              {currentTab === "details" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]" />
              )}
            </button>
            <button
              onClick={() => setCurrentTab("history")}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                currentTab === "history"
                  ? "text-[#2563EB]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Visit History
              {currentTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]" />
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Patient Details Tab */}
          {currentTab === "details" && (
            <div className="max-w-4xl mx-auto px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Patient Full Name */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Patient Full Name</Label>
                  <Input
                    value={formData.names}
                    onChange={(e: any) => handleChange("names", e.target.value)}
                    className={inputClass}
                    placeholder="John Doe"
                  />
                  {errors.names && <p className="text-red-500 text-xs mt-1">{errors.names}</p>}
                </div>

                {/* Age */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e: any) => handleChange("age", e.target.value)}
                    className={inputClass}
                    placeholder="58"
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                </div>

                {/* Sex */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Sex</Label>
                  <Select value={formData.sex} onValueChange={(v) => handleChange("sex", v)}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex}</p>}
                </div>

                {/* Marital Status */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Marital Status</Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CE - single">CE - single</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="DI">DI</SelectItem>
                      <SelectItem value="W">W</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Is Pregnant */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Is Pregnant</Label>
                  <Select 
                    value={formData.pregnant === "1" || formData.pregnant?.toLowerCase() === "yes" ? "yes" : "no"} 
                    onValueChange={(v) => handleChange("pregnant", v === "yes" ? "1" : "0")}
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">yes</SelectItem>
                      <SelectItem value="no">no</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Profession */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Profession</Label>
                  <Input
                    value={formData.occupation}
                    onChange={(e: any) => handleChange("occupation", e.target.value)}
                    className={inputClass}
                    placeholder="Farmer"
                  />
                </div>

                {/* Residence */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Residence</Label>
                  <Input
                    value={formData.residence}
                    onChange={(e: any) => handleChange("residence", e.target.value)}
                    className={inputClass}
                    placeholder="Rue Mermoz Douala"
                  />
                </div>

                {/* Contact */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Contact</Label>
                  <Input
                    value={formData.contact}
                    onChange={(e: any) => handleChange("contact", e.target.value)}
                    className={inputClass}
                    placeholder="688 854 144"
                  />
                  {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                </div>

                {/* Patient Code */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Patient Code</Label>
                  <Input
                    value={formData.patient_code}
                    onChange={(e: any) => handleChange("patient_code", e.target.value)}
                    className={inputClass}
                    placeholder="Enter patient code"
                  />
                </div>

                {/* Date */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e: any) => handleChange("date", e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* Hospitalisation */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Hospitalisation</Label>
                  <Select value={formData.hospitalisation} onValueChange={(v) => handleChange("hospitalisation", v)}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Receipt No */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Receipt No</Label>
                  <Input
                    value={formData.receipt_no}
                    onChange={(e: any) => handleChange("receipt_no", e.target.value)}
                    className={inputClass}
                    placeholder="Enter receipt number"
                  />
                </div>

                {/* Referral */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Referral</Label>
                  <Input
                    value={formData.referral}
                    onChange={(e: any) => handleChange("referral", e.target.value)}
                    className={inputClass}
                    placeholder="Enter referral"
                  />
                </div>

                {/* Past History */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Past History</Label>
                  <Textarea
                    value={formData.past_history}
                    onChange={(e: any) => handleChange("past_history", e.target.value)}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter past history"
                  />
                </div>

                {/* Signs & Symptoms */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Signs & Symptoms</Label>
                  <Textarea
                    value={formData.signs_symptoms}
                    onChange={(e: any) => handleChange("signs_symptoms", e.target.value)}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter signs and symptoms"
                  />
                </div>

                {/* Diagnosis */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Diagnosis</Label>
                  <Textarea
                    value={formData.diagnosis}
                    onChange={(e: any) => handleChange("diagnosis", e.target.value)}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter diagnosis"
                  />
                </div>

                {/* Investigations */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Investigations</Label>
                  <Textarea
                    value={formData.investigations}
                    onChange={(e: any) => handleChange("investigations", e.target.value)}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter investigations"
                  />
                </div>

                {/* Results */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Results</Label>
                  <Textarea
                    value={formData.results}
                    onChange={(e: any) => handleChange("results", e.target.value)}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter results"
                  />
                </div>

                {/* Treatment */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Treatment</Label>
                  <Textarea
                    value={formData.treatment}
                    onChange={(e: any) => handleChange("treatment", e.target.value)}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter treatment"
                  />
                </div>

                {/* Confirmatory Diagnosis */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Confirmatory Diagnosis</Label>
                  <Textarea
                    value={formData.confirmatory_diagnosis}
                    onChange={(e: any) => handleChange("confirmatory_diagnosis", e.target.value)}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter confirmatory diagnosis"
                  />
                </div>

                {/* Observations */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600 mb-2 block">Observations</Label>
                  <Textarea
                    value={formData.observations}
                    onChange={(e: any) => handleChange("observations", e.target.value)}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter observations"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Visit History Tab */}
          {currentTab === "history" && (
            <div className="px-4 py-4">
              <DataTable 
                data={visitHistoryData} 
                columns={visitHistoryColumns} 
                isLoading={false} 
              />
            </div>
          )}
        </div>

        {/* Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleMarkDeceased}
            className="bg-red-500 hover:bg-red-600 text-white border-0 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Deceased
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={editMutation.isPending}
            className="bg-[#2563EB] hover:bg-blue-700 text-white px-8"
          >
            {editMutation.isPending ? "Saving..." : "Update Record"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}