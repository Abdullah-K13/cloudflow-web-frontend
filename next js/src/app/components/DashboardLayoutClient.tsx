"use client"

import type React from "react"
import { Inter } from "next/font/google"
import Sidebar from "./sidebar";

const inter = Inter({ subsets: ["latin"] })

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} dashboard-layout min-h-screen bg-gray-50`}>
      <style jsx global>{`
        .dashboard-layout {
          /* Dashboard-specific styles */
          --dashboard-purple: #7c3aed;
          --dashboard-purple-dark: #5b21b6;
          --dashboard-gray-50: #f9fafb;
          --dashboard-gray-100: #f3f4f6;
          --dashboard-gray-200: #e5e7eb;
          --dashboard-gray-300: #d1d5db;
          --dashboard-gray-400: #9ca3af;
          --dashboard-gray-500: #6b7280;
          --dashboard-gray-600: #4b5563;
          --dashboard-gray-700: #374151;
          --dashboard-gray-800: #1f2937;
          --dashboard-gray-900: #111827;
        }
        
        .dashboard-layout .bg-purple-950 {
          background-color: var(--dashboard-purple-dark);
        }
        
        .dashboard-layout .bg-gray-50 {
          background-color: var(--dashboard-gray-50);
        }
        
        .dashboard-layout .bg-gray-100 {
          background-color: var(--dashboard-gray-100);
        }
        
        .dashboard-layout .border-gray-200 {
          border-color: var(--dashboard-gray-200);
        }
        
        .dashboard-layout .border-gray-300 {
          border-color: var(--dashboard-gray-300);
        }
        
        .dashboard-layout .text-gray-400 {
          color: var(--dashboard-gray-400);
        }
        
        .dashboard-layout .text-gray-500 {
          color: var(--dashboard-gray-500);
        }
        
        .dashboard-layout .text-gray-600 {
          color: var(--dashboard-gray-600);
        }
        
        .dashboard-layout .text-gray-700 {
          color: var(--dashboard-gray-700);
        }
        
        .dashboard-layout .text-gray-800 {
          color: var(--dashboard-gray-800);
        }
        
        /* Hover states */
        .dashboard-layout .hover\\:bg-gray-50:hover {
          background-color: var(--dashboard-gray-50);
        }
        
        .dashboard-layout .hover\\:bg-gray-100:hover {
          background-color: var(--dashboard-gray-100);
        }
        
        .dashboard-layout .hover\\:text-gray-700:hover {
          color: var(--dashboard-gray-700);
        }
        
        .dashboard-layout .hover\\:text-gray-800:hover {
          color: var(--dashboard-gray-800);
        }
        
        /* Focus states */
        .dashboard-layout .focus\\:ring-blue-500:focus {
          --tw-ring-color: #3b82f6;
        }
        
        .dashboard-layout .focus\\:border-blue-500:focus {
          border-color: #3b82f6;
        }
        
        /* Custom animations for dashboard */
        .dashboard-layout .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }
        
        .dashboard-layout .duration-200 {
          transition-duration: 200ms;
        }
        
        .dashboard-layout .ease-in-out {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Custom shadows for dashboard */
        .dashboard-layout .shadow-sm {
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        
        .dashboard-layout .shadow-md {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        
        .dashboard-layout .shadow-lg {
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }
        
        .dashboard-layout .shadow-2xl {
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
        }
      `}</style>
      
      <div className="flex">
        {/* Sidebar - Using existing component */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="ml-15 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}