import React from 'react';
import { UserPreferences, RoutePreference } from '../types';
import { Settings, MapPin, Clock, Users, Activity, Shuffle } from 'lucide-react';

interface SettingsPanelProps {
  preferences: UserPreferences;
  onUpdate: (newPrefs: UserPreferences) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ preferences, onUpdate, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleGoalChange = (goal: RoutePreference) => {
    onUpdate({ ...preferences, routePreference: goal });
  };

  const toggleAccessibility = () => {
    onUpdate({ ...preferences, accessibilityRequired: !preferences.accessibilityRequired });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Trip Preferences
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Optimization Goal</h3>
            <div className="grid grid-cols-1 gap-2">
              <GoalOption 
                active={preferences.routePreference === 'FASTEST'} 
                onClick={() => handleGoalChange('FASTEST')}
                icon={<Clock className="w-4 h-4" />}
                label="Fastest Route"
                desc="Prioritize travel time above all else."
              />
              <GoalOption 
                active={preferences.routePreference === 'LEAST_CROWDED'} 
                onClick={() => handleGoalChange('LEAST_CROWDED')}
                icon={<Users className="w-4 h-4" />}
                label="Least Crowded"
                desc="Avoid peak capacity vehicles."
              />
              <GoalOption 
                active={preferences.routePreference === 'LOW_WALKING'} 
                onClick={() => handleGoalChange('LOW_WALKING')}
                icon={<Activity className="w-4 h-4" />}
                label="Less Walking"
                desc="Minimize walking distance between stops."
              />
              <GoalOption 
                active={preferences.routePreference === 'FEWEST_TRANSFERS'} 
                onClick={() => handleGoalChange('FEWEST_TRANSFERS')}
                icon={<Shuffle className="w-4 h-4" />}
                label="Fewest Transfers"
                desc="Direct routes preferred."
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Accessibility</h3>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="checkbox" 
                checked={preferences.accessibilityRequired}
                onChange={toggleAccessibility}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div className="flex-1">
                <span className="font-medium text-slate-800 block">Wheelchair Accessible</span>
                <span className="text-xs text-slate-500">Step-free routes & accessible vehicles only</span>
              </div>
            </label>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

const GoalOption = ({ active, onClick, icon, label, desc }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, desc: string }) => (
  <button
    onClick={onClick}
    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
      active 
        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
    }`}
  >
    <div className={`mt-0.5 ${active ? 'text-indigo-600' : 'text-slate-500'}`}>{icon}</div>
    <div>
      <div className={`font-medium ${active ? 'text-indigo-900' : 'text-slate-900'}`}>{label}</div>
      <div className={`text-xs ${active ? 'text-indigo-700' : 'text-slate-500'}`}>{desc}</div>
    </div>
  </button>
);

export default SettingsPanel;