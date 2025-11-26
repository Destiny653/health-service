"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InlineEditFieldProps {
    value: string;
    fieldType: "text" | "number" | "date";
    onConfirm: (newValue: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function InlineEditField({
    value,
    fieldType,
    onConfirm,
    onCancel,
    isLoading = false,
}: InlineEditFieldProps) {
    const [tempValue, setTempValue] = React.useState(value);

    // Helper to safely parse date
    const parseDate = (val: string): Date | undefined => {
        if (!val || val.trim() === "") return undefined;
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const [date, setDate] = React.useState<Date | undefined>(
        parseDate(value)
    );
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleConfirm();
        } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
        }
    };

    const handleConfirm = () => {
        if (fieldType === "date" && date) {
            onConfirm(format(date, "yyyy-MM-dd"));
        } else {
            onConfirm(tempValue);
        }
    };

    if (fieldType === "date") {
        return (
            <div className="flex items-center gap-2 flex-nowrap" onClick={(e) => e.stopPropagation()}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "min-w-[180px] justify-start text-left font-normal bg-blue-50 border-b-2 border-x-0 border-t-0 rounded-none shadow-none h-11 text-base px-4 whitespace-nowrap",
                                !date && "text-muted-foreground"
                            )}
                        >
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                        <div className="border-t p-3 flex items-center justify-end gap-2 bg-gray-50">
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="p-2.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                                title="Cancel"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isLoading}
                                className="p-2.5 bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
                                title="Confirm"
                            >
                                <Check className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 flex-nowrap" onClick={(e) => e.stopPropagation()}>
            <Input
                ref={inputRef}
                type={fieldType}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="bg-blue-50 border-b-2 border-x-0 border-t-0 border-blue-500 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 py-2 px-3 text-base min-w-[150px] max-w-[250px]"
            />
            <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="p-2.5 bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                title="Confirm (Enter)"
            >
                <Check className="h-5 w-5 text-white" />
            </button>
            <button
                onClick={onCancel}
                disabled={isLoading}
                className="p-2.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                title="Cancel (Esc)"
            >
                <X className="h-5 w-5 text-white" />
            </button>
        </div>
    );
}
