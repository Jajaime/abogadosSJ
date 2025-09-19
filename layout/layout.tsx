/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useContext, useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEventListener, useUnmountEffect } from 'primereact/hooks';
import { classNames } from 'primereact/utils';
import AppFooter from './AppFooter';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';
import AppConfig from './AppConfig';
import { LayoutContext } from './context/layoutcontext';
import { PrimeReactContext } from 'primereact/api';
import { ChildContainerProps, LayoutState, AppTopbarRef } from '@/types';

function URLWatcher({
  hideMenu,
  hideProfileMenu
}: {
  hideMenu: () => void;
  hideProfileMenu: () => void;
}) {
  // ⬇️ Estos hooks ahora viven dentro de un componente que irá envuelto en <Suspense>
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    hideMenu();
    hideProfileMenu();
  }, [pathname, searchParams]);

  return null;
}

const Layout = ({ children }: ChildContainerProps) => {
  const { layoutConfig, layoutState, setLayoutState } = useContext(LayoutContext);
  const { setRipple } = useContext(PrimeReactContext); // (si no lo usas, quítalo)
  const topbarRef = useRef<AppTopbarRef>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] = useEventListener({
    type: 'click',
    listener: (event) => {
      const isOutsideClicked = !(
        sidebarRef.current?.isSameNode(event.target as Node) ||
        sidebarRef.current?.contains(event.target as Node) ||
        topbarRef.current?.menubutton?.isSameNode(event.target as Node) ||
        topbarRef.current?.menubutton?.contains(event.target as Node)
      );
      if (isOutsideClicked) hideMenu();
    }
  });

  const [bindProfileMenuOutsideClickListener, unbindProfileMenuOutsideClickListener] = useEventListener({
    type: 'click',
    listener: (event) => {
      const isOutsideClicked = !(
        topbarRef.current?.topbarmenu?.isSameNode(event.target as Node) ||
        topbarRef.current?.topbarmenu?.contains(event.target as Node) ||
        topbarRef.current?.topbarmenubutton?.isSameNode(event.target as Node) ||
        topbarRef.current?.topbarmenubutton?.contains(event.target as Node)
      );
      if (isOutsideClicked) hideProfileMenu();
    }
  });

  const hideMenu = () => {
    setLayoutState((prev: LayoutState) => ({
      ...prev,
      overlayMenuActive: false,
      staticMenuMobileActive: false,
      menuHoverActive: false
    }));
    unbindMenuOutsideClickListener();
    unblockBodyScroll();
  };

  const hideProfileMenu = () => {
    setLayoutState((prev: LayoutState) => ({
      ...prev,
      profileSidebarVisible: false
    }));
    unbindProfileMenuOutsideClickListener();
  };

  const blockBodyScroll = (): void => {
    document.body.classList.add('blocked-scroll');
  };
  const unblockBodyScroll = (): void => {
    document.body.classList.remove('blocked-scroll');
  };

  useEffect(() => {
    if (layoutState.overlayMenuActive || layoutState.staticMenuMobileActive) {
      bindMenuOutsideClickListener();
    }
    layoutState.staticMenuMobileActive && blockBodyScroll();
  }, [layoutState.overlayMenuActive, layoutState.staticMenuMobileActive]);

  useEffect(() => {
    if (layoutState.profileSidebarVisible) {
      bindProfileMenuOutsideClickListener();
    }
  }, [layoutState.profileSidebarVisible]);

  useUnmountEffect(() => {
    unbindMenuOutsideClickListener();
    unbindProfileMenuOutsideClickListener();
  });

  const containerClass = classNames('layout-wrapper', {
    'layout-overlay': layoutConfig.menuMode === 'overlay',
    'layout-static': layoutConfig.menuMode === 'static',
    'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
    'layout-overlay-active': layoutState.overlayMenuActive,
    'layout-mobile-active': layoutState.staticMenuMobileActive,
    'p-input-filled': layoutConfig.inputStyle === 'filled',
    'p-ripple-disabled': !layoutConfig.ripple
  });

  return (
    <>
      {/* ⬇️ Suspense boundary por encima de donde se usan los hooks */}
      <Suspense fallback={null}>
        <URLWatcher hideMenu={hideMenu} hideProfileMenu={hideProfileMenu} />
      </Suspense>

      <div className={containerClass}>
        <AppTopbar ref={topbarRef} />
        <div ref={sidebarRef} className="layout-sidebar">
          <Suspense fallback={null}>
            <AppSidebar />
          </Suspense>
        </div>
        <div className="layout-main-container">
          <div className="layout-main">{children}</div>
          <AppFooter />
        </div>
        <AppConfig />
        <div className="layout-mask"></div>
      </div>
    </>
  );
};

export default Layout;
