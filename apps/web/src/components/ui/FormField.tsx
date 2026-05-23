interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  error?: string
}

export function FormField({ label, required, children, error }: FormFieldProps) {
  return (
    <div className="form-group">
      <label className="af-label">
        {label}
        {required && <span style={{ color: 'var(--app-danger)' }}> *</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: 'var(--app-danger)', marginTop: 4 }}>{error}</span>
      )}
    </div>
  )
}
