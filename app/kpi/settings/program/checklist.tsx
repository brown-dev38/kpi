"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** programid 1 บนผู้รับผิดชอบ = รับผิดชอบทุกหลักสูตร */
export function programLabel(
  programs: { id: number; name: string }[],
  programid: number,
) {
  return programid === 1
    ? "ทุกหลักสูตร"
    : (programs.find((p) => p.id === programid)?.name ?? "-");
}

/** เลือกหลักสูตรที่ผู้รับผิดชอบดูแล: ทุกหลักสูตร หรือหลักสูตรที่ผูกกับตัวชี้วัด */
export function ProgramSelect({
  programs,
  value,
  onChange,
}: {
  programs: { id: number; name: string }[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>หลักสูตรที่รับผิดชอบ</FieldLabel>
      <Select
        value={value.toString()}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="เลือกหลักสูตร" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>หลักสูตร</SelectLabel>
            <SelectItem value="1">ทุกหลักสูตร</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export default function ProgramChecklist({
  programs,
  value,
  onChange,
}: {
  programs: { id: number; name: string }[];
  value: number[];
  onChange: (value: number[]) => void;
}) {
  return (
    <Field>
      <FieldLabel>รายงานแยกหลักสูตร</FieldLabel>
      <FieldDescription>
        ไม่เลือก = ไม่แยกหลักสูตร (รายงานผลเดียว)
      </FieldDescription>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        {programs.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <Checkbox
              id={`program-${p.id}`}
              checked={value.includes(p.id)}
              onCheckedChange={(checked) =>
                onChange(
                  checked
                    ? [...value, p.id]
                    : value.filter((id) => id !== p.id),
                )
              }
            />
            <Label htmlFor={`program-${p.id}`}>{p.name}</Label>
          </div>
        ))}
      </div>
    </Field>
  );
}
