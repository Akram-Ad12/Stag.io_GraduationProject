import React from 'react';

export default function StatCard({ label, value, trend, trendValue, icon: Icon, color = 'indigo' }) {
  const colorClasses = {
    indigo: 'text-indigo-600 bg-indigo-50',
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-3xl font-black text-gray-900">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
      
      {(trend || trendValue) && (
        <div className="flex items-center gap-2">
          {trend === 'up' ? (
            <span className="text-green-500 text-sm font-bold">↗ {trendValue}</span>
          ) : trend === 'down' ? (
            <span className="text-red-500 text-sm font-bold">↘ {trendValue}</span>
          ) : null}
          <span className="text-xs text-gray-400 font-medium">from last month</span>
        </div>
      )}
    </div>
  );
}
