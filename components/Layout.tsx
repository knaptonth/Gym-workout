
import React from 'react';
import { Trophy, Activity, History, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 pt-safe">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-xl shadow-lg shadow-blue-900/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">TourSpec<span className="text-yellow-400">Golf</span></span>
          </div>
          <button 
             onClick={() => onTabChange('settings')}
             className={`p-3 -mr-2 rounded-full hover:bg-slate-800 transition active:scale-95 ${activeTab === 'settings' ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-32">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 z-50 pb-safe pt-2">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-8 px-8 h-[60px]">
          <NavButton 
            icon={<Activity />} 
            label="Workout" 
            isActive={activeTab === 'workout'} 
            onClick={() => onTabChange('workout')} 
          />
          <NavButton 
            icon={<History />} 
            label="History" 
            isActive={activeTab === 'history'} 
            onClick={() => onTabChange('history')} 
          />
        </div>
      </nav>
    </div>
  );
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-2xl transition-all duration-300 ${isActive ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}
  >
    <div className={`p-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-500/10 -translate-y-1' : ''}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: isActive ? 2.5 : 2 })}
    </div>
    <span className={`text-[10px] font-bold transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 hidden'}`}>{label}</span>
  </button>
);
