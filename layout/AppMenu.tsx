'use client';

import React, { useContext, useMemo } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import type { AppMenuItem } from '@/types';
import { can } from '@/lib/authz';
import { useSession } from '@/hooks/useSession';

const AppMenu = () => {
  const { layoutConfig } = useContext(LayoutContext);
  const { roles } = useSession(); // ← viene de /api/me

  const model: AppMenuItem[] = [
    {
      label: 'Inicio',
      items: [
        {
          label: 'Dashboard',
          icon: 'pi pi-fw pi-home',
          to: '/'
        }
      ]
    },
    {
      label: 'Proceso 1',
      items: [
        {
          label: 'Ingresar Demanda',
          icon: 'pi pi-fw pi-file-import',
          to: '/pages/demanda/new',
          badge: 'NEW'
        },
        {
          label: 'Demandas',
          icon: 'pi pi-fw pi-book',
          to: '/pages/demanda/',
          badge: 'NEW'
        },
        {
          label: 'Documentación',
          icon: 'pi pi-fw pi-folder',
          to: '/pages/documentacion/list',
          badge: 'NEW'
        }
      ]
    },
    {
      label: 'Mantenedores',
      items: [
        {
          label: 'Usuarios',
          icon: 'pi pi-fw pi-user',
          to: '/pages/usuario',
          requiredPerm: 'viewUsersMenu', // solo admin
          badge: 'NEW'
        }
      ]
    }
  ];

  // --- Filtro por permisos/roles (recursivo)
  const filterByRoles = (items: AppMenuItem[], userRoles: string[] | undefined | null): AppMenuItem[] => {
    const recur = (arr: AppMenuItem[]): AppMenuItem[] =>
      arr
        .map((item) => {
          // Si el elemento requiere permiso y no lo tiene, ocultar
          if (item.requiredPerm && !can(userRoles, item.requiredPerm)) {
            return null;
          }

          // Procesar hijos
          if (item.items && item.items.length) {
            const children = recur(item.items);
            // Si no quedan hijos y el padre no tiene enlace propio, ocultar
            if (children.length === 0 && !item.to && !item.url) {
              return null;
            }
            return { ...item, items: children };
          }

          return item;
        })
        .filter(Boolean) as AppMenuItem[];

    return recur(items);
  };

  const filteredModel = useMemo(() => filterByRoles(model, roles), [model, roles]);

  return (
    <MenuProvider>
      <ul className="layout-menu">
        {filteredModel.map((item, i) =>
          !item?.seperator ? (
            <AppMenuitem item={item} root={true} index={i} key={item.label} />
          ) : (
            <li className="menu-separator" key={`sep-${i}`} />
          )
        )}
      </ul>
    </MenuProvider>
  );
};

export default AppMenu;
