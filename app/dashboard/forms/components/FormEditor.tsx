"use client"

import React from "react";
import { TSurvey } from "@/app/components";
import { FormEditorProvider } from "./FormEditorContext";
import { FormEditorContent } from "./FormEditorContent";

interface FormEditorProps {
    onSave: (formData: TSurvey, surveyId?: string) => Promise<any>
    data?: TSurvey
}

export function FormEditor({
    onSave,
    data,
}: FormEditorProps) {
    return (
        <FormEditorProvider initialData={data} onSave={onSave}>
            <FormEditorContent onSave={onSave} />
        </FormEditorProvider>
    );
} 