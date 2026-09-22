'use client';

import { PrimeReactProvider, addLocale, locale } from 'primereact/api';
import { LayoutProvider } from '../layout/context/layoutcontext';
import { useEffect } from 'react';

interface Props {
  children: React.ReactNode;
}

const primeLocaleEs = {
  startsWith: 'Empieza con',
  contains: 'Contiene',
  notContains: 'No contiene',
  endsWith: 'Termina con',
  equals: 'Igual a',
  notEquals: 'Distinto a',
  noFilter: 'Sin filtro',
  filter: 'Filtrar',
  lt: 'Menor que',
  lte: 'Menor o igual que',
  gt: 'Mayor que',
  gte: 'Mayor o igual que',
  dateIs: 'Fecha es',
  dateIsNot: 'Fecha no es',
  dateBefore: 'Fecha es antes de',
  dateAfter: 'Fecha es después de',
  custom: 'Personalizado',
  clear: 'Limpiar',
  apply: 'Aplicar',
  matchAll: 'Coincidir con todos',
  matchAny: 'Coincidir con cualquiera',
  addRule: 'Agregar regla',
  removeRule: 'Eliminar regla',
  accept: 'Aceptar',
  reject: 'Rechazar',
  choose: 'Elegir',
  upload: 'Subir',
  cancel: 'Cancelar',
  dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  monthNames: [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ],
  monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  today: 'Hoy',
  weekHeader: 'Sem',
  firstDayOfWeek: 1,
  dateFormat: 'dd/mm/yy',
  weak: 'Débil',
  medium: 'Medio',
  strong: 'Fuerte',
  passwordPrompt: 'Ingrese una contraseña',
  emptyFilterMessage: 'No se encontraron resultados',
  selectionMessage: '{0} elementos seleccionados',
  emptyMessage: 'No hay opciones disponibles',
};

export default function AppProviders({ children }: Props) {
  useEffect(() => {
    addLocale('es', primeLocaleEs);
    locale('es');
  }, []);

  return (
    <PrimeReactProvider value={{ ripple: true }}>
      <LayoutProvider>{children}</LayoutProvider>
    </PrimeReactProvider>
  );
}