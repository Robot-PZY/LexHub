import type { InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helpText?: string;
  error?: string;
};

function TextField({ label, helpText, error, id, className = '', ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;
  const helpId = fieldId ? `${fieldId}-help` : undefined;

  return (
    <label className={`lex-field${error ? ' lex-field-error' : ''} ${className}`.trim()}>
      {label && <span className="lex-field-label">{label}</span>}
      <input
        id={fieldId}
        className="lex-field-control"
        aria-invalid={Boolean(error)}
        aria-describedby={(error || helpText) ? helpId : undefined}
        {...props}
      />
      {(error || helpText) && <span id={helpId} className="lex-field-help">{error ?? helpText}</span>}
    </label>
  );
}

export default TextField;

