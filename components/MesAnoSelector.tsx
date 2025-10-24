'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';

type Props = {
  /** Texto descriptivo opcional (no se pinta como <label/> para evitar duplicar tu label externo) */
  label?: string;
  /** Meses seleccionados en formato 'YYYY-MM' (controlado) */
  value: string[];
  /** Emisor de cambios */
  onChange: (v: string[]) => void;
  /** Años visibles. Si no se provee, el componente calcula dinámicamente un set inicial. */
  years?: number[];
  /** Límite inferior/superior permitido al agregar años en el modal (opcionales, defaults sensatos) */
  minYearAllowed?: number; // default 1970
  maxYearAllowed?: number; // default año actual + 1
};

const mesesES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const sortYYYYMM = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b));

/** Deriva años desde 'YYYY-MM' */
const yearsFromValue = (v: string[]) => {
  const years = new Set<number>();
  for (const k of v) {
    const y = Number((k || '').split('-')[0]);
    if (!Number.isNaN(y)) years.add(y);
  }
  return years;
};

/** Rango compacto: currentYear..(currentYear-4) + años existentes en 'value' */
const buildDefaultYears = (value: string[], explicitYears?: number[]) => {
  if (explicitYears && explicitYears.length) {
    return Array.from(new Set(explicitYears)).sort((a, b) => a - b);
  }
  const now = new Date();
  const cy = now.getFullYear();
  const base = new Set<number>([cy, cy - 1, cy - 2, cy - 3, cy - 4]);
  for (const y of yearsFromValue(value)) base.add(y);
  return Array.from(base).sort((a, b) => a - b);
};

const MesAnoSelector: React.FC<Props> = ({
  label,
  value,
  onChange,
  years,
  minYearAllowed = 1970,
  maxYearAllowed,
}) => {
  const _max = maxYearAllowed ?? new Date().getFullYear() + 1;

  // Estado local de años visibles (derivado de props.value y/o props.years)
  const [yearsLocal, setYearsLocal] = useState<number[]>(() =>
    buildDefaultYears(value, years)
  );

  // Si cambian value o years explícitos, re-derivamos inteligentemente
  useEffect(() => {
    setYearsLocal((prev) => {
      const target = new Set<number>(buildDefaultYears(value, years));
      // preserva años ya agregados por el usuario también
      for (const y of prev) target.add(y);
      return Array.from(target).sort((a, b) => a - b);
    });
  }, [value, years]);

  // Modal para gestionar años
  const [manageOpen, setManageOpen] = useState(false);
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const isSelected = (yyyy: number, monthIdx0: number) => {
    const key = `${yyyy}-${pad2(monthIdx0 + 1)}`;
    return value.includes(key);
  };

  const toggle = (yyyy: number, monthIdx0: number) => {
    const key = `${yyyy}-${pad2(monthIdx0 + 1)}`;
    if (value.includes(key)) {
      onChange(value.filter((v) => v !== key));
    } else {
      onChange(sortYYYYMM([...value, key]));
    }
  };

  const clearAll = () => onChange([]);

  const addYearsRange = () => {
    setError('');
    const yf = yearFrom ?? yearTo ?? null;
    const yt = yearTo ?? yearFrom ?? null;
    if (yf === null || yt === null) {
      setError('Ingresa al menos un año (o un rango).');
      return;
    }
    if (yf < minYearAllowed || yt < minYearAllowed || yf > _max || yt > _max) {
      setError(`Rango fuera de límites (${minYearAllowed}–${_max}).`);
      return;
    }
    const a = Math.min(yf, yt);
    const b = Math.max(yf, yt);
    const next = new Set(yearsLocal);
    for (let y = a; y <= b; y++) next.add(y);
    setYearsLocal(Array.from(next).sort((x, y) => x - y));
    // no tocamos selection; solo agregamos visibilidad de años
    setYearFrom(null);
    setYearTo(null);
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button label="Cerrar" onClick={() => setManageOpen(false)} text />
      <Button label="Agregar años" icon="pi pi-plus" onClick={addYearsRange} />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Cabecera compacta */}
      <div className="flex align-items-center justify-content-between gap-2">
        <div className="text-color-secondary">
          {label ? <span className="font-medium">{label}</span> : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            className="p-button-text p-button-sm"
            icon="pi pi-calendar-plus"
            label="Gestionar años"
            onClick={() => setManageOpen(true)}
          />
          {value.length > 0 && (
            <Button
              type="button"
              className="p-button-text p-button-sm"
              label="Limpiar todo"
              onClick={clearAll}
            />
          )}
        </div>
      </div>

      {/* Grillas de meses por año */}
      <div className="flex flex-col gap-3">
        {yearsLocal.map((yyyy) => (
          <div key={yyyy} className="border-round surface-border surface-card p-3">
            <div className="mb-2 font-semibold">{yyyy}</div>
            <div className="grid">
              {mesesES.map((mes, i) => {
                const selected = isSelected(yyyy, i);
                return (
                  <div key={`${yyyy}-${i}`} className="col-6 md:col-3 lg:col-2">
                    <Button
                      type="button"
                      className={`w-full ${selected ? 'p-button-success' : 'p-button-outlined'}`}
                      label={mes}
                      onClick={() => toggle(yyyy, i)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de seleccionados */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((k) => {
            const [y, m] = k.split('-');
            const idx = Number(m) - 1;
            const nombreMes = mesesES[idx] ?? k;
            return (
              <Button
                key={k}
                type="button"
                className="p-button-sm p-button-rounded p-button-outlined"
                label={`${nombreMes} ${y}`}
                icon="pi pi-times"
                iconPos="right"
                onClick={() => onChange(value.filter((v) => v !== k))}
                tooltip="Quitar"
              />
            );
          })}
        </div>
      )}

      {/* Modal para gestionar años */}
      <Dialog
        header="Gestionar años visibles"
        visible={manageOpen}
        style={{ width: '480px' }}
        onHide={() => setManageOpen(false)}
        footer={footer}
      >
        <p className="mb-3">
          Agrega un <strong>año</strong> o un <strong>rango de años</strong> para mostrar en el selector.
        </p>

        <div className="grid">
          <div className="col-12 md:col-6">
            <label className="block mb-2">Desde</label>
            <InputNumber
              value={yearFrom}
              onValueChange={(e) => setYearFrom((e.value as number) ?? null)}
              useGrouping={false}
              showButtons
              min={minYearAllowed}
              max={_max}
              placeholder="e.g. 2010"
            />
          </div>
          <div className="col-12 md:col-6">
            <label className="block mb-2">Hasta</label>
            <InputNumber
              value={yearTo}
              onValueChange={(e) => setYearTo((e.value as number) ?? null)}
              useGrouping={false}
              showButtons
              min={minYearAllowed}
              max={_max}
              placeholder="e.g. 2013"
            />
          </div>
        </div>

        {error && <small className="p-error mt-2 block">{error}</small>}

        <div className="mt-4">
          <div className="mb-2">Años visibles:</div>
          <div className="flex flex-wrap gap-2">
            {yearsLocal.map((y) => (
              <span key={y} className="px-2 py-1 border-round surface-200 text-color text-sm">
                {y}
              </span>
            ))}
          </div>
          <small className="block mt-2 text-color-secondary">
            Límite: {minYearAllowed}–{_max}. No se eliminan años existentes; solo se agregan a la vista.
          </small>
        </div>
      </Dialog>
    </div>
  );
};

export default MesAnoSelector;
