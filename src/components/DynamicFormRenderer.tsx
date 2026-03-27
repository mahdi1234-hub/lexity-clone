"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { FormSchema, FormField, FormStep, FormSubmissionData } from "@/types/form-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

function buildZodSchema(fields: FormField[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;
    switch (field.type) {
      case "number":
      case "slider":
      case "rating":
        fieldSchema = z.coerce.number();
        if (field.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(field.min);
        if (field.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(field.max);
        if (!field.required) fieldSchema = fieldSchema.optional();
        break;
      case "checkbox":
      case "switch":
        fieldSchema = z.boolean().default(false);
        break;
      case "multi-select":
      case "tag-input":
        fieldSchema = z.array(z.string());
        if (!field.required) fieldSchema = fieldSchema.optional();
        break;
      default:
        fieldSchema = z.string();
        if (field.required) fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
        else fieldSchema = fieldSchema.optional();
        if (field.type === "email") fieldSchema = (fieldSchema as z.ZodString).email("Invalid email");
        break;
    }
    shape[field.name] = fieldSchema;
  }
  return z.object(shape);
}

function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  error?: string;
}) {
  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "number":
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder || ""}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
            min={field.min}
            max={field.max}
            step={field.step}
            className="bg-white/60 border-black/10 focus:border-[#C48C56]/40"
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder || ""}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/60 border-black/10 focus:border-[#C48C56]/40 min-h-[80px]"
          />
        );

      case "select":
        return (
          <Select value={(value as string) ?? ""} onValueChange={onChange}>
            <SelectTrigger className="bg-white/60 border-black/10">
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multi-select":
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) && (value as string[]).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const current = (Array.isArray(value) ? value : []) as string[];
                    if (selected) {
                      onChange(current.filter((v) => v !== opt.value));
                    } else {
                      onChange([...current, opt.value]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selected
                      ? "bg-[#C48C56] text-white border-[#C48C56]"
                      : "bg-white/60 border-black/10 hover:border-[#C48C56]/40"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => onChange(!!checked)}
            />
            <span className="text-sm opacity-70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {field.description || field.label}
            </span>
          </div>
        );

      case "switch":
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {field.description || field.label}
            </span>
            <Switch
              checked={!!value}
              onCheckedChange={(checked) => onChange(checked)}
            />
          </div>
        );

      case "radio":
        return (
          <RadioGroup value={(value as string) ?? ""} onValueChange={onChange}>
            {field.options?.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} />
                <Label htmlFor={`${field.name}-${opt.value}`} className="text-sm opacity-70 cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "slider":
        return (
          <div className="space-y-2">
            <Slider
              value={[typeof value === "number" ? value : field.min ?? 0]}
              onValueChange={(vals) => onChange(vals[0])}
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
              className="w-full"
            />
            <div className="flex justify-between text-xs opacity-50">
              <span>{field.min ?? 0}</span>
              <span className="font-medium text-[#C48C56]">{typeof value === "number" ? value : field.min ?? 0}</span>
              <span>{field.max ?? 100}</span>
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.max ?? 5 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                className="transition-transform hover:scale-110"
              >
                <svg
                  className={`w-6 h-6 ${(value as number) > i ? "text-[#C48C56]" : "text-black/15"}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </button>
            ))}
          </div>
        );

      case "date":
        return (
          <Input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/60 border-black/10 focus:border-[#C48C56]/40"
          />
        );

      case "file":
        return (
          <div className="border-2 border-dashed border-black/10 rounded-lg p-4 text-center hover:border-[#C48C56]/30 transition-colors cursor-pointer">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange(file.name);
              }}
              className="hidden"
              id={`file-${field.name}`}
            />
            <label htmlFor={`file-${field.name}`} className="cursor-pointer">
              <svg className="w-6 h-6 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {value ? String(value) : field.placeholder || "Click to upload"}
              </p>
            </label>
          </div>
        );

      case "tag-input":
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {Array.isArray(value) && (value as string[]).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C48C56]/10 text-[#C48C56] text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = (value as string[]).filter((_, idx) => idx !== i);
                      onChange(newTags);
                    }}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder={field.placeholder || "Type and press Enter..."}
              className="bg-white/60 border-black/10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const val = input.value.trim();
                  if (val) {
                    const current = (Array.isArray(value) ? value : []) as string[];
                    onChange([...current, val]);
                    input.value = "";
                  }
                }
              }}
            />
          </div>
        );

      default:
        return (
          <Input
            placeholder={field.placeholder || ""}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/60 border-black/10"
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      {field.type !== "checkbox" && field.type !== "switch" && (
        <Label className="text-sm font-medium opacity-80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {field.label}
          {field.required && <span className="text-[#C48C56] ml-0.5">*</span>}
        </Label>
      )}
      {field.description && field.type !== "checkbox" && field.type !== "switch" && (
        <p className="text-xs opacity-50 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {field.description}
        </p>
      )}
      {renderField()}
      {error && (
        <p className="text-xs text-red-500 mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface DynamicFormRendererProps {
  schema: FormSchema;
  onSubmit: (data: FormSubmissionData) => void;
  onCancel?: () => void;
}

export default function DynamicFormRenderer({ schema, onSubmit, onCancel }: DynamicFormRendererProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const allFields = schema.isMultiStep
    ? schema.steps?.flatMap((s) => s.fields) ?? []
    : schema.fields ?? [];

  const zodSchema = buildZodSchema(allFields);

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: allFields.reduce((acc, field) => {
      if (field.defaultValue !== undefined) {
        acc[field.name] = field.defaultValue;
      } else if (field.type === "checkbox" || field.type === "switch") {
        acc[field.name] = false;
      } else if (field.type === "multi-select" || field.type === "tag-input") {
        acc[field.name] = [];
      } else if (field.type === "number" || field.type === "slider" || field.type === "rating") {
        acc[field.name] = field.min ?? 0;
      } else {
        acc[field.name] = "";
      }
      return acc;
    }, {} as Record<string, unknown>),
  });

  const currentFields: FormField[] = schema.isMultiStep
    ? schema.steps?.[currentStep]?.fields ?? []
    : schema.fields ?? [];

  const totalSteps = schema.steps?.length ?? 1;
  const isLastStep = currentStep >= totalSteps - 1;
  const progress = schema.isMultiStep ? ((currentStep + 1) / totalSteps) * 100 : 100;

  const handleNext = async () => {
    const fieldNames = currentFields.map((f) => f.name);
    const isValid = await form.trigger(fieldNames as (keyof typeof zodSchema.shape)[]);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleFormSubmit = form.handleSubmit((values) => {
    const submission: FormSubmissionData = {
      formId: schema.id,
      formTitle: schema.title,
      values,
      submittedAt: new Date().toISOString(),
    };
    onSubmit(submission);
  });

  const currentStepData: FormStep | undefined = schema.isMultiStep ? schema.steps?.[currentStep] : undefined;

  return (
    <div className="w-full max-w-[95%] card-flashlight bg-white/70 backdrop-blur-xl rounded-2xl border border-black/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-black/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#C48C56] animate-pulse" />
            <h3
              className="text-base font-medium tracking-tight opacity-90"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {schema.title}
            </h3>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="opacity-40 hover:opacity-80 transition-opacity">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        {schema.description && (
          <p className="text-xs opacity-50 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {schema.description}
          </p>
        )}

        {/* Multi-step progress */}
        {schema.isMultiStep && (
          <div className="mt-3 space-y-2">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between">
              {schema.steps?.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 text-xs transition-all ${
                    i <= currentStep ? "opacity-80" : "opacity-30"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < currentStep
                        ? "bg-[#C48C56] text-white"
                        : i === currentStep
                        ? "bg-[#C48C56]/20 text-[#C48C56] border border-[#C48C56]/40"
                        : "bg-black/5 text-black/30"
                    }`}
                  >
                    {i < currentStep ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step title (multi-step) */}
      {schema.isMultiStep && currentStepData && (
        <div className="px-5 pt-3">
          <h4
            className="text-sm font-medium opacity-80"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {currentStepData.title}
          </h4>
          {currentStepData.description && (
            <p className="text-xs opacity-40 mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {currentStepData.description}
            </p>
          )}
        </div>
      )}

      {/* Fields */}
      <form onSubmit={handleFormSubmit}>
        <div className="px-5 py-4 space-y-4">
          {currentFields.map((field) => (
            <FormFieldRenderer
              key={field.name}
              field={field}
              value={form.watch(field.name)}
              onChange={(val) => form.setValue(field.name, val, { shouldValidate: true })}
              error={form.formState.errors[field.name]?.message as string | undefined}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-2 flex items-center justify-between">
          <div>
            {schema.isMultiStep && currentStep > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-xs opacity-60 hover:opacity-100"
              >
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs border-black/10"
              >
                Cancel
              </Button>
            )}
            {schema.isMultiStep && !isLastStep ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                className="text-xs bg-[#C48C56] hover:bg-[#B07B45] text-white"
              >
                Next
                <svg className="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-[#C48C56] hover:bg-[#B07B45] text-white"
              >
                {schema.submitLabel || "Submit"}
                <svg className="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
