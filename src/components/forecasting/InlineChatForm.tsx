"use client";

import React, { useState } from "react";

interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "radio" | "textarea";
  options?: { label: string; value: string }[];
  default?: string | number | boolean;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}

interface InlineChatFormProps {
  formId: string;
  fields: FormField[];
  onSubmit: (formId: string, data: Record<string, any>) => void;
  title?: string;
}

export default function InlineChatForm({
  formId,
  fields,
  onSubmit,
  title,
}: InlineChatFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.default !== undefined) {
        initial[field.name] = field.default;
      } else if (field.type === "checkbox") {
        initial[field.name] = false;
      } else {
        initial[field.name] = "";
      }
    });
    return initial;
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    onSubmit(formId, formData);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 mt-2">
        <div className="flex items-center gap-2 text-[#78c8b4]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "'Syncopate', sans-serif" }}>
            Configuration Submitted
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {fields.map((field) => (
            <div key={field.name} className="text-xs text-white/50">
              <span className="text-white/30">{field.label}:</span>{" "}
              <span className="text-white/70">
                {typeof formData[field.name] === "boolean"
                  ? formData[field.name]
                    ? "Yes"
                    : "No"
                  : String(formData[field.name])}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 mt-2 space-y-4"
    >
      {title && (
        <h4
          className="text-sm tracking-[0.12em] uppercase text-white/60 mb-4"
          style={{ fontFamily: "'Syncopate', sans-serif" }}
        >
          {title}
        </h4>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div
            key={field.name}
            className={
              field.type === "textarea" ? "col-span-1 md:col-span-2" : ""
            }
          >
            <label
              className="block text-xs text-white/50 mb-1.5 tracking-wide"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {field.label}
              {field.required && <span className="text-[#e8a87c] ml-1">*</span>}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-[#78c8b4]/40 focus:ring-1 focus:ring-[#78c8b4]/20 transition-all"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, Number(e.target.value))}
                placeholder={field.placeholder}
                required={field.required}
                min={field.min}
                max={field.max}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-[#78c8b4]/40 focus:ring-1 focus:ring-[#78c8b4]/20 transition-all"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-[#78c8b4]/40 focus:ring-1 focus:ring-[#78c8b4]/20 transition-all resize-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              />
            )}

            {field.type === "select" && (
              <select
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full bg-[#1a1c1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-[#78c8b4]/40 focus:ring-1 focus:ring-[#78c8b4]/20 transition-all"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "checkbox" && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={!!formData[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border transition-all ${
                      formData[field.name]
                        ? "bg-[#78c8b4]/30 border-[#78c8b4]/60"
                        : "bg-white/[0.05] border-white/15 group-hover:border-white/30"
                    }`}
                  >
                    {formData[field.name] && (
                      <svg
                        className="w-5 h-5 text-[#78c8b4]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  className="text-xs text-white/60"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Enable
                </span>
              </label>
            )}

            {field.type === "radio" && (
              <div className="flex flex-wrap gap-2">
                {field.options?.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-xs ${
                      formData[field.name] === opt.value
                        ? "bg-[#78c8b4]/15 border-[#78c8b4]/40 text-[#78c8b4]"
                        : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${formId}-${field.name}`}
                      value={opt.value}
                      checked={formData[field.name] === opt.value}
                      onChange={() => handleChange(field.name, opt.value)}
                      className="sr-only"
                    />
                    <span style={{ fontFamily: "'Cormorant Garamond', serif" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-white/80 text-xs tracking-[0.15em] uppercase border border-white/15 hover:bg-[#78c8b4]/15 hover:border-[#78c8b4]/30 hover:text-[#78c8b4] transition-all duration-300"
          style={{ fontFamily: "'Syncopate', sans-serif" }}
        >
          <span>Submit</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
