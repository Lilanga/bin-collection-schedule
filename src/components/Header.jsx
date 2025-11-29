import React from 'react';
import { Calendar, MapPin, Search } from 'lucide-react';

export default function Header({ savedAddress, showSearch, isMobile, onChangeAddress }) {
    if (isMobile && savedAddress && !showSearch) {
        return null;
    }

    return (
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-800">Bin Collection Schedule</h1>
            </div>
            <p className="text-gray-600">Find your waste and recycling collection dates</p>

            {/* Saved Address Display - Only on desktop */}
            {savedAddress && !showSearch && !isMobile && (
                <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">{savedAddress}</span>
                    <button
                        onClick={onChangeAddress}
                        className="ml-2 text-green-600 hover:text-green-700 flex items-center gap-1 text-sm font-medium"
                    >
                        <Search className="w-4 h-4" />
                        Change
                    </button>
                </div>
            )}
        </div>
    );
}
