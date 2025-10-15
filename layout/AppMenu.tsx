 

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import type { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Inicio',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },
        {
            label: 'Proceso 1',
            items: [
                { label: 'Ingresar Demanda', icon: 'pi pi-fw pi-file-import', to: '/pages/demanda/new', badge: 'NEW' },
                { label: 'Demandas', icon: 'pi pi-fw pi-book', to: '/pages/demanda/', badge: 'NEW' },
                { label: 'Documentación', icon: 'pi pi-fw pi-folder', to: '/pages/documentacion/list', badge: 'NEW' },
            ]
        },
        {
            label: 'Mantenedores',
            items: [
                { label: 'Usuarios', icon: 'pi pi-fw pi pi-user', to: '/pages/usuario', badge: 'NEW' }
            ]
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
