"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useEditDocumentRow, EditRowPayload } from "./useGetDoc";

interface EditingCell {
    rowId: string;
    fieldName: string;
    docCode: string;
}

export function useInlineEdit() {
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [tempValue, setTempValue] = useState("");
    const editMutation = useEditDocumentRow();

    const startEdit = (
        rowId: string,
        fieldName: string,
        docCode: string,
        currentValue: string
    ) => {
        setEditingCell({ rowId, fieldName, docCode });
        setTempValue(currentValue);
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setTempValue("");
    };

    const confirmEdit = async (newValue: string) => {
        if (!editingCell) return;

        const { rowId, fieldName, docCode } = editingCell;

        // Build the payload - API expects simple string values, not field correction objects
        const payload: any = {
            [fieldName]: newValue,
        };

        try {
            await editMutation.mutateAsync({
                doc_code: docCode,
                row_id: rowId,
                payload,
            });

            toast.success("Field updated successfully!");
            setEditingCell(null);
            setTempValue("");
        } catch (error: any) {
            toast.error(error.message || "Failed to update field");
        }
    };

    return {
        editingCell,
        tempValue,
        setTempValue,
        startEdit,
        cancelEdit,
        confirmEdit,
        isLoading: editMutation.isPending,
    };
}
