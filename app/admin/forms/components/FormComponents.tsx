"use client"

import { TOption } from "@/app/components";
import { Checkbox, Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckCircleIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from "@headlessui/react";
import Image from "next/image";

// 옵션 미리보기(드롭다운) 컴포넌트
export function DropdownPreview({ options, value, onChange }: { options: TOption[]; value: string; onChange: (v: string) => void }) {
    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative w-64">
                <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span className="block truncate">{options.find(o => o.value === value)?.label || '선택하세요'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                </ListboxButton>
                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                    {options.map((option) => (
                        <ListboxOption
                            key={`${option.value}-${option.label}`}
                            className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                            value={option.value}
                        >
                            {({ selected }) => (
                                <>
                                    <span className={`absolute left-2 top-2 flex items-center`}>{selected ? <CheckCircleIcon className="h-5 w-5 text-blue-500" /> : <span className="inline-block w-5" />}</span>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                </>
                            )}
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    );
}


// 체크박스 그룹(다중 선택) 컴포넌트
export function CheckboxGroup({ options, value, onChange, renderOption }: { options: TOption[]; value: string[]; onChange: (v: string[]) => void; renderOption: (opt: TOption, checked: boolean, idx: number) => React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            {options.map((opt, idx) => {
                const checked = value.includes(opt.value);
                return (
                    <label key={`${idx}-${opt.value}-${opt.label}`} className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded ${checked ? 'bg-blue-50' : ''}`}>
                        <Checkbox
                            checked={checked}
                            onChange={() => {
                                if (checked) onChange(value.filter((v: string) => v !== opt.value));
                                else onChange([...value, opt.value]);
                            }}
                            className={`${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'} mr-2 w-4 h-4 rounded border-2`}
                        />
                        {renderOption(opt, checked, idx)}
                    </label>
                );
            })}
        </div>
    );
}


// 옵션 입력 Combobox
export function OptionCombobox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    return (
        <Combobox value={value} onChange={onChange}>
            <div className="relative w-full">
                <ComboboxInput
                    className="w-full border-b focus:outline-none focus:border-blue-500 bg-transparent py-2 text-base min-h-[40px] px-3 rounded"
                    displayValue={(v: string) => v}
                    onChange={e => onChange(e.target.value)}
                />
                <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {options.map((option, idx) => (
                        <ComboboxOption key={`${idx}-${option}`} value={option} className={({ active }) => `cursor-pointer select-none py-2 px-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>{option}</ComboboxOption>
                    ))}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}


// 복합질문 항목명 Combobox
export function CompositeItemCombobox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    return (
        <Combobox value={value} onChange={onChange}>
            <div className="relative w-32">
                <ComboboxInput
                    className="w-full border rounded px-3 py-2 text-base min-h-[40px]"
                    displayValue={(v: string) => v}
                    onChange={e => onChange(e.target.value)}
                />
                <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {options.map((option, idx) => (
                        <ComboboxOption key={`${idx}-${option}`} value={option} className={({ active }) => `cursor-pointer select-none py-2 px-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>{option}</ComboboxOption>
                    ))}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}



export function ImagePreview({ images }: { images?: string[] }) {
    if (!images || images.length === 0) return null;
    return (
        <div className="flex flex-col gap-2 mb-4">
            {images.map((url, idx) => (
                <Image key={idx} src={url} alt="문항 이미지" className="max-h-40 rounded border object-contain" width={100} height={100} />
            ))}
        </div>
    );
} 