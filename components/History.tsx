import React from 'react';
import { getLogs } from '../services/storageService';
import { SESSION_METADATA } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Building2, Home, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

export const History: React.FC = () => {
  const logs = getLogs().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const chartData = logs.slice(0, 7).map(log => {
    const totalSets = log.exercises.reduce((acc, ex) => acc + ex.setLogs.filter(s => s.completed).length, 0);
    return {
      date: new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' }),
      sets: totalSets,
      timestamp: new Date(log.date).getTime()
    };
  }).reverse();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <h2 className="text-2xl font-black text-white">Performance History</h2>
      
      {/* Volume Chart */}
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
        <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Volume (Completed Sets/Session)</h3>
        <div className="h-44 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: '#334155' }}
                />
                <Bar dataKey="sets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No workout data recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Workout Log Timeline</h3>
        {logs.length === 0 && (
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 text-center text-slate-400 text-sm">
            Complete your first session from the dashboard to track your consistency.
          </div>
        )}
        {logs.map(log => {
          const meta = SESSION_METADATA[log.dayId] || { title: log.dayId, subtitle: '' };
          const completedSets = log.exercises.reduce((acc, ex) => acc + ex.setLogs.filter(s => s.completed).length, 0);

          return (
            <div key={log.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold">
                  <Calendar size={14} />
                  <span>
                    {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {log.mode && (
                    <span className="text-[10px] font-bold bg-slate-900 px-2 py-0.5 rounded text-blue-300 border border-slate-700 flex items-center gap-1">
                      {log.mode === 'home' ? <Home size={10} /> : <Building2 size={10} />}
                      {log.mode === 'home' ? 'Home' : 'Gym'}
                    </span>
                  )}
                  <span className="text-[10px] font-bold bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
                    {meta.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-bold">{meta.subtitle || log.dayId}</span>
                <span className="text-slate-400"><strong className="text-white">{completedSets}</strong> sets completed</span>
              </div>

              {log.cardioFinisher && (
                <div className="text-[11px] bg-slate-900/60 p-2 rounded-xl text-blue-300 flex items-center gap-1.5 border border-slate-700/60">
                  <Activity size={12} className="text-blue-400 shrink-0" />
                  <span>Finisher: {log.cardioFinisher.type} ({log.cardioFinisher.durationMinutes} min)</span>
                </div>
              )}

              {log.feedback && (
                <div className="text-xs bg-slate-900/40 p-2.5 rounded-xl text-slate-300 flex items-start gap-2 border border-slate-700/40">
                  <Sparkles size={13} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 text-[11px] text-slate-300 leading-relaxed">{log.feedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
