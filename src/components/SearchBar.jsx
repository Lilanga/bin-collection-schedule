import React, { useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import AddressSuggestions from './AddressSuggestions';

export default function SearchBar({
    address,
    onAddressChange,
    onKeyPress,
    onSearch,
    loading,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    onSuggestionSelect,
    loadingSuggestions
}) {
    const containerRef = useRef(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowSuggestions]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex gap-2">
                <div className="flex-1 relative" ref={containerRef}>
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
                    <input
                        type="text"
                        value={address}
                        onChange={onAddressChange}
                        onKeyPress={onKeyPress}
                        onFocus={() => address.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="Start typing your address (e.g., 68 racecourse road pakenham)"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />

                    {showSuggestions && (
                        <AddressSuggestions
                            suggestions={suggestions}
                            onSelect={onSuggestionSelect}
                        />
                    )}

                    {loadingSuggestions && address.length >= 3 && (
                        <div className="absolute right-3 top-3">
                            <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {address.length > 0 && address.length < 3 && (
                        <div className="absolute left-10 -bottom-6 text-xs text-gray-500">
                            Type at least 3 characters to see suggestions
                        </div>
                    )}
                </div>
                <button
                    onClick={onSearch}
                    disabled={loading || address.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Search className="w-5 h-5" />
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
        </div>
    );
}
