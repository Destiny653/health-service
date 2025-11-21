"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import { EditRowPayload, useEditDocumentRow } from "./team/hooks/docs/useGetDoc";

interface PatientEditSheetProps {
  modalOpen: boolean;
  selectedPatient: any;
  activeTab: string;
  setActiveTab: any;
  closeModal: () => void;
  data: any[];
}

export default function PatientEditSheet({
  modalOpen,
  selectedPatient,
  activeTab,
  setActiveTab,
  closeModal,
  data,
}: PatientEditSheetProps) {
  const editMutation = useEditDocumentRow();

  // Form state initialized empty
  const [formData, setFormData] = React.useState({
    names: "",
    age: "",
    sex: "",
    pregnant: "",
    occupation: "",
    residence: "",
    contact: "",
    past_history: "",
  });

  console.log(selectedPatient)

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Sync form when selectedPatient changes
  React.useEffect(() => {
    if (selectedPatient) {
      // FIXED: Added optional chaining (?.) to all fields
      setFormData({
        names: selectedPatient.patientName || "",
        age: selectedPatient.age || "",
        sex: selectedPatient.sex || "",
        pregnant: selectedPatient.pregnant || "",
        occupation: selectedPatient.profession || "",
        residence: selectedPatient.residence || "",
        contact: selectedPatient.contact || "",
        past_history: selectedPatient.pastHistory || "",
      });
      setErrors({});
    }
  }, [selectedPatient]);

  const getBorderClass = (field: string) => {
    const base = "bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 transition-all duration-200 focus:outline-none";
    if (errors[field]) return `${base} border-b-red-500`;
    return `${base} focus:border-b-[#028700]`;
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
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
    if (!["M", "F", "Male", "Female"].includes(formData.sex.trim()))
      newErrors.sex = "Sex must be Male or Female";
    if (!formData.contact.trim()) newErrors.contact = "Contact is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !activeTab) return;
    if (!validate()) return;

    const payload = {
      names: {
        extracted_value: formData.names.trim(),
        was_corrected: true,
        corrected_at: new Date().toISOString(),
      },
      age: {
        extracted_value: formData.age,
        was_corrected: true,
        corrected_at: new Date().toISOString(),
      },
      sex: {
        extracted_value: formData.sex.toUpperCase().startsWith("M") ? "M" : "F",
        was_corrected: true,
        corrected_at: new Date().toISOString(),
      },
      pregnant: {
        extracted_value: formData.pregnant === "Yes" || formData.pregnant === "1" ? "1" : "0",
        was_corrected: true,
        corrected_at: new Date().toISOString(),
      },
      occupation: {
        extracted_value: formData.occupation,
        was_corrected: true,
        corrected_at: new Date().toISOString(),
      },
      residence: {
        extracted_value: formData.residence,
        was_corrected: true,
        corrected_at: new Date().toISOString(),
      },
      contact: {
        extracted_value: formData.contact,
        was_corrected: true,
        corrected_at: new Date().toISOString(),
      },
      past_history: {
        extracted_value: formData.past_history,
        was_corrected: true,
        corrected_at: new Date().toISOString(),
      },
    };

    editMutation.mutate(
      {
        doc_code: selectedPatient.docCode,
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
    if (!open) {
      closeModal();
    }
  };

  if (!selectedPatient) return null;

  return (
    <Sheet open={modalOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto py-8 px-4">
          <h2 className="text-2xl font-bold mb-8 text-[#028700]">Edit Patient Record</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <Label htmlFor="names">Full Name</Label>
              <Input
                id="names"
                value={formData.names}
                onChange={(e) => handleChange("names", e.target.value)}
                className={getBorderClass("names")}
                placeholder="Enter full name"
              />
              {errors.names && <p className="text-red-500 text-sm mt-1">{errors.names}</p>}
            </div>

            {/* Age */}
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className={getBorderClass("age")}
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
            </div>

            {/* Sex */}
            <div>
              <Label>Sex</Label>
              <Select value={formData.sex} onValueChange={(v) => handleChange("sex", v)}>
                <SelectTrigger className={getBorderClass("sex")}>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.sex && <p className="text-red-500 text-sm mt-1">{errors.sex}</p>}
            </div>

            {/* Pregnant */}
            <div>
              <Label>Is Pregnant</Label>
              <Select
                value={formData.pregnant === "1" || formData.pregnant === "Yes" ? "1" : "0"}
                onValueChange={(v) => handleChange("pregnant", v === "1" ? "Yes" : "No")}
              >
                <SelectTrigger className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Yes</SelectItem>
                  <SelectItem value="0">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Occupation */}
            <div>
              <Label>Occupation</Label>
              <Input
                value={formData.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700]"
              />
            </div>

            {/* Residence */}
            <div>
              <Label>Residence</Label>
              <Input
                value={formData.residence}
                onChange={(e) => handleChange("residence", e.target.value)}
                className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700]"
              />
            </div>

            {/* Contact */}
            <div>
              <Label>Contact</Label>
              <Input
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                className={getBorderClass("contact")}
              />
              {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
            </div>

            {/* Past History */}
            <div className="md:col-span-2">
              <Label>Past History</Label>
              <Input
                value={formData.past_history}
                onChange={(e) => handleChange("past_history", e.target.value)}
                className="bg-[#F2F7FB] border-[#D9D9D9] border-t-0 border-x-0 border-b-2 py-6 focus:border-[#028700]"
              />
            </div>
          </div>

          {/* Fixed Bottom Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t p-4 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={editMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={editMutation.isPending}
              className="bg-[#028700] hover:bg-green-700 text-white"
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}