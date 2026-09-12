import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-soft-bg dark:bg-soft-darkBg text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar (Desktop Floating Capsule + Mobile Bottom Nav) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:pl-[108px] pb-24 lg:pb-8 transition-all duration-200">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
