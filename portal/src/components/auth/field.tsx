type FieldProps = {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

export function Field({ label, name, placeholder, type = "text" }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} placeholder={placeholder} type={type} required />
    </label>
  );
}
