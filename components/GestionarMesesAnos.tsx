'use client';

import React, { useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';

type Props = {
  title: string;            // Título del modal (p.ej. "Cotizaciones de Salud")
  value: string[];          // ["2024-01","2025-03", ...]
  onChange: (val: string[]) => void;
  triggerLabel?: string;    // Texto del botón que abre el modal (default: "Gestionar años")
  initialYear?: number;     // Año base inicial (default: año actual)
};

const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function toKey(year: number, monthIndex: number) {
  const mm = String(monthIndex + 1).padStart(2, '0');
  return `${year}-${mm}`;
}

function groupByYear(value: string[]) {
  const map = new Map<number, Set<number>>(); // year -> Set(monthIndex)
  value.forEach((ym) => {
    const [y, m] = ym.split('-');
    const year = Number(y);
    const monthIndex = Number(m) - 1;
    if (!map.has(year)) map.set(year, new Set<number>());
    map.get(year)!.add(monthIndex);
  });
  return map;
}

function flatten(map: Map<number, Set<number>>) {
  const out: string[] = [];
  map.forEach((months, y) => {
    months.forEach((m) => out.push(toKey(y, m)));
  });
  return out.sort(); // ISO: YYYY-MM
}

function yearsFromValue(value: string[]) {
  const set = new Set<number>();
  value.forEach((ym) => set.add(Number(ym.slice(0, 4))));
  return set;
}

function buildSummary(value: string[]) {
  if (!value?.length) return 'Sin meses seleccionados';
  const perYear = new Map<number, number[]>();
  value.forEach((ym) => {
    const y = Number(ym.slice(0, 4));
    const m = Number(ym.slice(5, 7)) - 1;
    if (!perYear.has(y)) perYear.set(y, []);
    perYear.get(y)!.push(m);
  });
  const years = [...perYear.keys()].sort((a, b) => b - a);
  const chunks = years.map((y) => {
    const months = perYear.get(y)!.sort((a, b) => a - b).map(i => monthLabels[i]).join(',');
    return `${y}: ${months}`;
  });
  return chunks.join(' · ');
}

const GestionarMesesAnos: React.FC<Props> = ({
  title,
  value,
  onChange,
  triggerLabel = 'Gestionar años',
  initialYear
}) => {
  const [visible, setVisible] = useState(false);

  // Mapa de meses por año
  const [byYear, setByYear] = useState<Map<number, Set<number>>>(() => groupByYear(value));
  // Lista ORDENADA de "años visibles" (aunque en byYear estén vacíos o no existan aún)
  const [visibleYears, setVisibleYears] = useState<number[]>([]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const summary = useMemo(() => buildSummary(value), [value]);

  // Abre modal y sincroniza estado con prop `value`
  const open = () => {
    const map = groupByYear(value);
    let ys = [...yearsFromValue(value)];
    if (ys.length === 0) {
      ys = [initialYear ?? currentYear]; // seed mínimo
    }
    // Orden nuevo -> antiguo
    ys.sort((a, b) => b - a);
    setByYear(map);
    setVisibleYears(ys);
    setVisible(true);
  };

  // Agregar año anterior (encadenable). Se agrega al FINAL (abajo) de la lista.
  const addPreviousYear = () => {
    if (visibleYears.length === 0) {
      const y = initialYear ?? currentYear;
      setVisibleYears([y]);
      if (!byYear.has(y)) {
        const next: Map<number, Set<number>> = new Map(byYear);
        next.set(y, new Set<number>());
        setByYear(next);
      }
      return;
    }

    const minY = Math.min(...visibleYears);
    const yToAdd = minY - 1;

    if (!visibleYears.includes(yToAdd)) {
      setVisibleYears([...visibleYears, yToAdd]); // al final (abajo)
    }

    if (!byYear.has(yToAdd)) {
      const next: Map<number, Set<number>> = new Map(byYear);
      next.set(yToAdd, new Set<number>());
      setByYear(next);
    }
  };

  // Alternar un mes
  const toggleMonth = (year: number, monthIndex: number, checked: boolean) => {
    const next: Map<number, Set<number>> = new Map(byYear);
    if (!next.has(year)) next.set(year, new Set<number>());
    const months = new Set<number>(next.get(year) ?? new Set<number>());
    if (checked) months.add(monthIndex);
    else months.delete(monthIndex);
    next.set(year, months);
    setByYear(next);
  };

  // Limpiar meses de un año
  const clearYear = (year: number) => {
    const next: Map<number, Set<number>> = new Map(byYear);
    next.set(year, new Set<number>());
    setByYear(next);
  };

  // ¿Se puede eliminar? (solo si no tiene meses)
  const canDeleteYear = (year: number) => {
    const size = byYear.get(year)?.size ?? 0;
    return size === 0;
  };

  // Eliminar año de la vista (y del map si está vacío)
  const deleteYear = (year: number) => {
    if (!canDeleteYear(year)) return; // por seguridad extra
    const nextYears = visibleYears.filter((y) => y !== year);
    setVisibleYears(nextYears);
    if (byYear.has(year)) {
      const next: Map<number, Set<number>> = new Map(byYear);
      next.delete(year);
      setByYear(next);
    }
  };

  // Guardar cambios
  const save = () => {
    onChange(flatten(byYear));
    setVisible(false);
  };

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <Button type="button" label={triggerLabel} icon="pi pi-calendar" onClick={open} />
      <small className="text-600">{summary}</small>

      <Dialog
        visible={visible}
        header={title}
        modal
        style={{ width: '720px', maxWidth: '95vw' }}
        onHide={() => setVisible(false)}
        headerClassName="text-white"
        headerStyle={{ background: '#024F97' }}
        // 👇 el botón flotante se posicionará relativo a este contenedor
        contentStyle={{ position: 'relative', padding: 0, overflow: 'hidden' }}
        footer={
  <div
    className="flex justify-content-between align-items-center w-full"
    style={{ padding: '0.6rem' }}
  >
    {/* IZQUIERDA: botón para agregar año */}
    <div className="flex gap-2">
      <Button
        type="button"
        icon="pi pi-plus"
        label="Agregar año anterior"
        className="p-button-rounded p-button-default"
        onClick={addPreviousYear}
      />
    </div>

    {/* DERECHA: botones Cancelar / Guardar */}
    <div className="flex gap-2">
      <Button
        label="Cancelar"
        severity="danger"
        icon="pi pi-times"
        onClick={() => setVisible(false)}
      />
      <Button
        label="Guardar"
        severity="success"
        icon="pi pi-check"
        onClick={save}
      />
    </div>
  </div>
}
      >
        {/* Área scrollable */}
        <div className="grid" style={{ maxHeight: '70vh', padding: '0.6rem', overflow: 'auto' }}>
          {visibleYears.map((year) => (
            <div key={year} className="col-12">
              <div className="p-3 surface-card border-round shadow-1 w-full">
                <div className="flex justify-between align-items-center mb-2">
                  <h3 className="m-0">{year}</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      text
                      icon="pi pi-eraser"
                      label="Limpiar meses"
                      onClick={() => clearYear(year)}
                    />
                    <Button
                      type="button"
                      text
                      icon="pi pi-trash"
                      label="Eliminar año"
                      onClick={() => deleteYear(year)}
                      disabled={!canDeleteYear(year)}
                      tooltip="Solo se elimina si no tiene meses seleccionados"
                    />
                  </div>
                </div>

                <Divider className="my-2" />

                <div className="grid">
                  {monthLabels.map((ml, idx) => {
                    const checked = !!byYear.get(year)?.has(idx);
                    return (
                      <div key={idx} className="col-6 md:col-3">
                        <div className="flex align-items-center gap-2">
                          <Checkbox
                            inputId={`${year}-${idx}`}
                            checked={checked}
                            onChange={(e) => toggleMonth(year, idx, e.checked ?? false)}
                          />
                          <label htmlFor={`${year}-${idx}`}>{ml}</label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Dialog>



    </div>
  );
};

export default GestionarMesesAnos;
