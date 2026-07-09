import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helpText?: string;
  error?: string;
};

function Textarea({ label, helpText, error, id, className = '', ...props }: TextareaProps) {
  const fieldId = id ?? props.name;
  const helpId = fieldId ? `${fieldId}-help` : undefined;

  return (
    <label className={`lex-textarea${error ? ' lex-textarea-error' : ''} ${className}`.trim()}>
      {label && <span className="lex-field-label">{label}</span>}
      <textarea
        id={fieldId}
        className="lex-textarea-control"
        aria-invalid={Boolean(error)}
        aria-describedby={(error || helpText) ? helpId : undefined}
        {...props}
      />
      {(error || helpText) && <span id={helpId} className="lex-field-help">{error ?? helpText}</span>}
    </label>
  );
}

export default Textarea;

