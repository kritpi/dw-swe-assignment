type FieldProps = {
  label: string;
  min?: number;
  name: string;
  placeholder: string;
  type?: string;
};

export function Field({
  label,
  min,
  name,
  placeholder,
  type = "text",
}: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input min={min} name={name} placeholder={placeholder} type={type} required />
    </label>
  );
}
