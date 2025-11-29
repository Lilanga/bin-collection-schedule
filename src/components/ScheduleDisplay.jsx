import React from 'react';
import { Calendar, Trash2, Recycle, Leaf } from 'lucide-react';
import { isThisWeek, formatDate } from '../utils/dateUtils';

export default function ScheduleDisplay({ schedule }) {
    const bins = [
        { type: 'green', name: 'Green Bin (Organics)', icon: Leaf, color: 'green' },
        { type: 'recycle', name: 'Yellow Bin (Recycling)', icon: Recycle, color: 'yellow' },
        { type: 'rubbish', name: 'Red Bin (Rubbish)', icon: Trash2, color: 'red' }
    ];

    const colorClasses = {
        green: 'bg-green-50 border-green-200 text-green-700',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        red: 'bg-red-50 border-red-200 text-red-700'
    };

    const upcomingColorClasses = {
        green: { active: 'bg-green-600 text-white font-semibold', inactive: 'bg-green-100 text-green-700' },
        yellow: { active: 'bg-yellow-600 text-white font-semibold', inactive: 'bg-yellow-100 text-yellow-700' },
        red: { active: 'bg-red-600 text-white font-semibold', inactive: 'bg-red-100 text-red-700' }
    };

    const hasCollectionThisWeek = [...schedule.green.dates, ...schedule.recycle.dates, ...schedule.rubbish.dates].some(date => isThisWeek(date));

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    This Week's Collections
                </h2>
                <div className="grid gap-4">
                    {bins.map(({ type, name, icon: Icon, color }) => {
                        const thisWeekDate = schedule[type].dates.find(date => isThisWeek(date));

                        if (thisWeekDate) {
                            return (
                                <div key={type} className={`${colorClasses[color]} border-2 rounded-lg p-4 flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-6 h-6" />
                                        <div>
                                            <div className="font-semibold">{name}</div>
                                            <div className="text-sm opacity-80">Every {schedule[type].weeks} week{schedule[type].weeks > 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">{formatDate(thisWeekDate)}</div>
                                        <div className="text-sm opacity-80">
                                            {thisWeekDate.toDateString() === new Date().toDateString() ? 'Today!' :
                                                thisWeekDate < new Date() ? 'Collected' : 'Upcoming'}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
                {!hasCollectionThisWeek && (
                    <p className="text-gray-500 text-center py-4">No collections scheduled for this week</p>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Collections</h2>
                <div className="space-y-6">
                    {bins.map(({ type, name, icon: Icon, color }) => (
                        <div key={type}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-5 h-5 text-${color}-600`} />
                                <h3 className="font-semibold text-gray-700">{name}</h3>
                                <span className="text-sm text-gray-500">- Every {schedule[type].weeks} week{schedule[type].weeks > 1 ? 's' : ''} on {schedule[type].day}s</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {schedule[type].dates.map((date, idx) => (
                                    <div key={idx} className={`px-3 py-2 rounded ${isThisWeek(date) ? upcomingColorClasses[color].active : upcomingColorClasses[color].inactive}`}>
                                        {formatDate(date)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
