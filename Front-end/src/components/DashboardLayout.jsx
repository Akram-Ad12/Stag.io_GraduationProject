import React from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, role }) {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar role={role} />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
