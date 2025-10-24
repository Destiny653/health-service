import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Patient } from "@/hooks/usePatients";
import { data } from "@/data";
import { DataTable } from "@/components/PatientsTable";
import { ColumnDef } from "@tanstack/react-table";

// Function to fetch patients data
const fetchPatients = async (): Promise<Patient[]> => {
  // Simulate API delay and return the imported data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 500);
  });
};


// 🚀 Main Application Component
export default function DataEntriesContent() {
  // Use the real useQuery hook to fetch data
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  // Error handling
  React.useEffect(() => {
    if (error) toast.error("Error fetching patients data");
  }, [error]);

  // Define columns based on the Patient interface
  const columns = React.useMemo<ColumnDef<Patient>[]>(
    () => [
      { accessorKey: "case", header: "Case #" },
      { accessorKey: "patientName", header: "Patient Name" },
      { accessorKey: "sex", header: "Sex" },
      { accessorKey: "age", header: "Age" },
      { accessorKey: "maritalStatus", header: "Marital Status" },
      { accessorKey: "isPregnant", header: "Is Pregnant" },
      { accessorKey: "profession", header: "Profession" },
      { accessorKey: "residence", header: "Residence" },
      { accessorKey: "contact", header: "Contact" },
      { accessorKey: "history", header: "History" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
