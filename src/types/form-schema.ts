export type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "multi-select"
  | "checkbox"
  | "switch"
  | "radio"
  | "slider"
  | "rating"
  | "date"
  | "file"
  | "tag-input";

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: FormFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string | number | boolean | string[];
}

export interface FormStep {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  submitLabel?: string;
  steps?: FormStep[];
  fields?: FormField[];
  isMultiStep: boolean;
}

export interface FormSubmissionData {
  formId: string;
  formTitle: string;
  values: Record<string, unknown>;
  submittedAt: string;
}
