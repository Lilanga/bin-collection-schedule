import React from 'react';
import { MapPin } from 'lucide-react';

export default function AddressSuggestions({ suggestions, onSelect }) {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
                <div
                    key={index}
                    onClick={() => onSelect(suggestion)}
                    className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-800">{suggestion.text}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
