'use client';

import React from 'react';
import { Button } from 'primereact/button';

type Props = {
  /** Texto descriptivo (opcional). No se renderiza como label para evitar duplicados en el form. */
  label?: string;
  /** Arreglo controlado de meses en formato 'YYYY-MM' */
  value: string[];
  /** Emisor de cambios */
  onChange: (v: string[]) => void;
  /** Años a mostrar (ej: [2024, 2025, 2026]) */
  years: number[];
};

const mesesES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Ordena por año-mes, aprovechando que 'YYYY-MM' ordena bien lexicográficamente */
const sortYYYYMM = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b));

const MesAnoSelector: React.FC<Props> = ({ value, onChange, years }) => {
  const isSelected = (yyyy: number, monthIdx0: number) => {
    const key = `${yyyy}-${pad2(monthIdx0 + 1)}`;
    return value.includes(key);
  };

  const toggle = (yyyy: number, monthIdx0: number) => {
    const key = `${yyyy}-${pad2(monthIdx0 + 1)}`;
    if (value.includes(key)) {
      onChange(value.filter(v => v !== key));
    } else {
      onChange(sortYYYYMM([...value, key]));
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className="flex flex-col gap-3">
      {/* Grillas de meses por año */}
      <div className="flex flex-col gap-3">
        {years.map((yyyy) => (
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
                onClick={() => onChange(value.filter(v => v !== k))}
                tooltip="Quitar"
              />
            );
          })}
          <Button
            type="button"
            className="p-button-text p-button-sm"
            label="Limpiar todo"
            onClick={clearAll}
          />
        </div>
      )}
    </div>
  );
};

export default MesAnoSelector;
