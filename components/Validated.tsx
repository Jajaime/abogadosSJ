// components/Validated.tsx
'use client';

import React from 'react';
import { classNames } from 'primereact/utils';
import { InputText, InputTextProps } from 'primereact/inputtext';
import { Dropdown, DropdownProps } from 'primereact/dropdown';
import { InputNumber, InputNumberProps } from 'primereact/inputnumber';
import { Calendar, CalendarProps } from 'primereact/calendar';

type BaseProps = {
  label: string;
  missingFields: string[];
  missingKey: string; // Debe coincidir con el string que pusiste en "missing.push('...')"
  containerClassName?: string;
  requiredMsg?: string;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  hint?: React.ReactNode; // texto auxiliar opcional
};

const isMissing = (missingFields: string[], key: string) =>
  missingFields.includes(key);

export const ValidatedInputText: React.FC<BaseProps & InputTextProps> = ({
  label,
  missingFields,
  missingKey,
  containerClassName = 'field col-12 md:col-4',
  requiredMsg = `${label} es requerido.`,
  labelProps,
  hint,
  className,
  id,
  ...rest
}) => {
  const invalid = isMissing(missingFields, missingKey);
  return (
    <div className={containerClassName}>
      <label htmlFor={id} {...labelProps}>{label}</label>
      <InputText
        id={id}
        className={classNames(className, { 'p-invalid': invalid })}
        {...rest}
      />
      {hint && !invalid && <small className="p-helper">{hint}</small>}
      {invalid && <small className="p-invalid">{requiredMsg}</small>}
    </div>
  );
};

export const ValidatedDropdown: React.FC<BaseProps & DropdownProps> = ({
  label,
  missingFields,
  missingKey,
  containerClassName = 'field col-12 md:col-4',
  requiredMsg = `${label} es requerido.`,
  labelProps,
  hint,
  className,
  id,
  ...rest
}) => {
  const invalid = isMissing(missingFields, missingKey);
  return (
    <div className={containerClassName}>
      <label htmlFor={id} {...labelProps}>{label}</label>
      <Dropdown
        id={id}
        className={classNames(className, { 'p-invalid': invalid })}
        {...rest}
      />
      {hint && !invalid && <small className="p-helper">{hint}</small>}
      {invalid && <small className="p-invalid">{requiredMsg}</small>}
    </div>
  );
};

export const ValidatedInputNumber: React.FC<BaseProps & InputNumberProps> = ({
  label,
  missingFields,
  missingKey,
  containerClassName = 'field col-12 md:col-4',
  requiredMsg = `${label} es requerido.`,
  labelProps,
  hint,
  className,
  id,
  ...rest
}) => {
  const invalid = isMissing(missingFields, missingKey);
  return (
    <div className={containerClassName}>
      <label htmlFor={id} {...labelProps}>{label}</label>
      <InputNumber
        id={id}
        className={classNames(className, { 'p-invalid': invalid })}
        {...rest}
      />
      {hint && !invalid && <small className="p-helper">{hint}</small>}
      {invalid && <small className="p-invalid">{requiredMsg}</small>}
    </div>
  );
};

export const ValidatedCalendar: React.FC<BaseProps & CalendarProps> = ({
  label,
  missingFields,
  missingKey,
  containerClassName = 'field col-12 md:col-4',
  requiredMsg = `${label} es requerido.`,
  labelProps,
  hint,
  className,
  id,
  ...rest
}) => {
  const invalid = isMissing(missingFields, missingKey);
  return (
    <div className={containerClassName}>
      <label htmlFor={id} {...labelProps}>{label}</label>
      <Calendar
        id={id}
        className={classNames(className, { 'p-invalid': invalid })}
        {...rest}
      />
      {hint && !invalid && <small className="p-helper">{hint}</small>}
      {invalid && <small className="p-invalid">{requiredMsg}</small>}
    </div>
  );
};