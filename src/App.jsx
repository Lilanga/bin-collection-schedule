import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Recycle, Leaf, MapPin, Search, Settings } from 'lucide-react';

export default function App() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMagicKey, setSelectedMagicKey] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [savedAddress, setSavedAddress] = useState(null);
  const [showSearch, setShowSearch] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved address from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedAddress');
    const savedSchedule = localStorage.getItem('savedSchedule');

    if (saved) {
      setSavedAddress(saved);
      setAddress(saved);

      if (savedSchedule) {
        const parsedSchedule = JSON.parse(savedSchedule);
        // Convert date strings back to Date objects
        parsedSchedule.green.dates = parsedSchedule.green.dates.map(d => new Date(d));
        parsedSchedule.recycle.dates = parsedSchedule.recycle.dates.map(d => new Date(d));
        parsedSchedule.rubbish.dates = parsedSchedule.rubbish.dates.map(d => new Date(d));
        setSchedule(parsedSchedule);
        setShowSearch(false);
      }
    }
  }, []);

  const getDayOfWeek = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  // Debounce function to optimize API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch address suggestions
  const fetchSuggestions = async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const suggestUrl = `https://corp-geo.mapshare.vic.gov.au/arcgis/rest/services/Geocoder/VMAddressEZIAdd/GeocodeServer/suggest?searchExtent=145.36,-37.86,145.78,-38.34&location=145.57,-38.1&text=${encodeURIComponent(text)}&f=json&maxSuggestions=15`;

      const response = await fetch(suggestUrl);
      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Create debounced version of fetchSuggestions
  const debouncedFetchSuggestions = React.useMemo(
    () => debounce(fetchSuggestions, 300),
    []
  );

  // Handle address input change
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    setSelectedMagicKey(null);
    debouncedFetchSuggestions(value);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion.text);
    setSelectedMagicKey(suggestion.magicKey);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getNextCollectionDate = (startDate, dayOfWeek, weeksInterval) => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = new Date(start);
    const targetDay = getDayOfWeek(dayOfWeek);

    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }

    while (current < today) {
      current.setDate(current.getDate() + (weeksInterval * 7));
    }

    return current;
  };

  const getCollectionDates = (startDate, dayOfWeek, weeksInterval, count = 4) => {
    const dates = [];
    let current = getNextCollectionDate(startDate, dayOfWeek, weeksInterval);

    for (let i = 0; i < count; i++) {
      dates.push(new Date(current));
      current = new Date(current);
      current.setDate(current.getDate() + (weeksInterval * 7));
    }

    return dates;
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-AU', options);
  };

  const isThisWeek = (date) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return date >= weekStart && date <= weekEnd;
  };

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    setSchedule(null);
    setShowSuggestions(false);

    try {
      let location;

      // If we have a magicKey from suggestion, use it directly
      if (selectedMagicKey) {
        const geocodeUrl = `https://corp-geo.mapshare.vic.gov.au/arcgis/rest/services/Geocoder/VMAddressEZIAdd/GeocodeServer/findAddressCandidates?magicKey=${selectedMagicKey}&f=json`;

        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.candidates || geocodeData.candidates.length === 0) {
          throw new Error('Address not found. Please select an address from the suggestions.');
        }

        location = geocodeData.candidates[0].location;
      } else {
        // Fallback to regular address search
        const geocodeUrl = `https://corp-geo.mapshare.vic.gov.au/arcgis/rest/services/Geocoder/VMAddressEZIAdd/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(address)}&f=json`;

        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.candidates || geocodeData.candidates.length === 0) {
          throw new Error('Address not found. Please check your address and try again.');
        }

        location = geocodeData.candidates[0].location;
      }

      const wasteUrl = `https://services3.arcgis.com/TJxZpUnYIJOvcYwE/arcgis/rest/services/Waste_Collection_Zones/FeatureServer/0/query?f=geojson&outFields=*&returnGeometry=true&inSR=4326&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryPoint&geometry=${location.x},${location.y}`;

      const wasteResponse = await fetch(wasteUrl);
      const wasteData = await wasteResponse.json();

      if (!wasteData.features || wasteData.features.length === 0) {
        throw new Error('No collection schedule found for this address.');
      }

      const properties = wasteData.features[0].properties;

      const greenDates = getCollectionDates(properties.grn_start, properties.grn_day, properties.grn_weeks);
      const recycleDates = getCollectionDates(properties.rec_start, properties.rec_day, properties.rec_weeks);
      const rubbishDates = getCollectionDates(properties.rub_start, properties.rub_day, properties.rub_weeks);

      const newSchedule = {
        green: { day: properties.grn_day, dates: greenDates, weeks: properties.grn_weeks },
        recycle: { day: properties.rec_day, dates: recycleDates, weeks: properties.rec_weeks },
        rubbish: { day: properties.rub_day, dates: rubbishDates, weeks: properties.rub_weeks }
      };

      setSchedule(newSchedule);

      // Save to localStorage
      localStorage.setItem('savedAddress', address);
      localStorage.setItem('savedSchedule', JSON.stringify(newSchedule));
      setSavedAddress(address);
      setShowSearch(false);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showSuggestions) {
      fetchSchedule();
    }
  };

  const handleChangeAddress = () => {
    setShowSearch(true);
    setSchedule(null);
    setError(null);
  };

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.address-input-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - Hidden on mobile when address is saved */}
        {(!isMobile || !savedAddress || showSearch) && (
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
                  onClick={handleChangeAddress}
                  className="ml-2 text-green-600 hover:text-green-700 flex items-center gap-1 text-sm font-medium"
                >
                  <Search className="w-4 h-4" />
                  Change
                </button>
              </div>
            )}
          </div>
        )}

        {showSearch && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative address-input-container">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => address.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Start typing your address (e.g., 68 racecourse road pakenham)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-800">{suggestion.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                onClick={fetchSchedule}
                disabled={loading || address.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Search className="w-5 h-5" />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {schedule && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                This Week's Collections
              </h2>
              <div className="grid gap-4">
                {[
                  { type: 'green', name: 'Green Bin (Organics)', icon: Leaf, color: 'green' },
                  { type: 'recycle', name: 'Yellow Bin (Recycling)', icon: Recycle, color: 'yellow' },
                  { type: 'rubbish', name: 'Red Bin (Rubbish)', icon: Trash2, color: 'red' }
                ].map(({ type, name, icon: Icon, color }) => {
                  const thisWeekDate = schedule[type].dates.find(date => isThisWeek(date));
                  const colorClasses = {
                    green: 'bg-green-50 border-green-200 text-green-700',
                    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                    red: 'bg-red-50 border-red-200 text-red-700'
                  };

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
              {![...schedule.green.dates, ...schedule.recycle.dates, ...schedule.rubbish.dates].some(date => isThisWeek(date)) && (
                <p className="text-gray-500 text-center py-4">No collections scheduled for this week</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Collections</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-700">Green Bin (Organics)</h3>
                    <span className="text-sm text-gray-500">- Every {schedule.green.weeks} week{schedule.green.weeks > 1 ? 's' : ''} on {schedule.green.day}s</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {schedule.green.dates.map((date, idx) => (
                      <div key={idx} className={`px-3 py-2 rounded ${isThisWeek(date) ? 'bg-green-600 text-white font-semibold' : 'bg-green-100 text-green-700'}`}>
                        {formatDate(date)}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Recycle className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-gray-700">Yellow Bin (Recycling)</h3>
                    <span className="text-sm text-gray-500">- Every {schedule.recycle.weeks} week{schedule.recycle.weeks > 1 ? 's' : ''} on {schedule.recycle.day}s</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {schedule.recycle.dates.map((date, idx) => (
                      <div key={idx} className={`px-3 py-2 rounded ${isThisWeek(date) ? 'bg-yellow-600 text-white font-semibold' : 'bg-yellow-100 text-yellow-700'}`}>
                        {formatDate(date)}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-gray-700">Red Bin (Rubbish)</h3>
                    <span className="text-sm text-gray-500">- Every {schedule.rubbish.weeks} week{schedule.rubbish.weeks > 1 ? 's' : ''} on {schedule.rubbish.day}s</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {schedule.rubbish.dates.map((date, idx) => (
                      <div key={idx} className={`px-3 py-2 rounded ${isThisWeek(date) ? 'bg-red-600 text-white font-semibold' : 'bg-red-100 text-red-700'}`}>
                        {formatDate(date)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!schedule && !loading && showSearch && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-600">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="mb-2">Start typing your Victorian address to see suggestions</p>
            <p className="text-sm text-gray-500">Select an address from the dropdown and click Search</p>
          </div>
        )}

        {/* Floating Action Button - Mobile Only */}
        {isMobile && savedAddress && !showSearch && (
          <button
            onClick={handleChangeAddress}
            className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110"
            aria-label="Change address"
          >
            <Settings className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
