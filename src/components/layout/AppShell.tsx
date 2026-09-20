import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { Sparkles } from 'lucide-react';

interface AppShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ currentPath, onNavigate, children }) => {
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
        {/* Top Navbar */}
        <TopNavbar
          onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
          onNavigate={onNavigate}
          onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating TrustHire AI Action Trigger */}
      <button
        onClick={() => setIsAIDrawerOpen(true)}
        title="Open TrustHire AI Assistant"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-xs rounded-2xl shadow-xl hover:shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 active:scale-95 group"
      >
        <Sparkles className="w-4 h-4 animate-spin-slow group-hover:scale-110 transition-transform" />
        <span className="tracking-wide">Ask TrustHire AI</span>
      </button>

      {/* Slide-out AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
      />
    </div>
  );
};
