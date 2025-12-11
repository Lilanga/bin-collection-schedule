import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Settings } from 'lucide-react';
import NotificationSettings from './components/NotificationSettings';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ScheduleDisplay from './components/ScheduleDisplay';
import { scheduleNotifications, isNotificationEnabled } from './utils/notifications';
import { getSuggestions, getGeocodeByMagicKey, getGeocodeByAddress, getWasteCollection } from './services/api';
import { getCollectionDates } from './utils/dateUtils';

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
        try {
          const parsedSchedule = JSON.parse(savedSchedule);

          // Process each bin type to ensure dates are current
          ['green', 'recycle', 'rubbish'].forEach(type => {
            if (parsedSchedule[type]) {
              const { dates, day, weeks } = parsedSchedule[type];
              // If we have saved dates, use the first one as a reference to calculate the current schedule
              // This works even if the saved dates are weeks/months old
              if (dates && dates.length > 0) {
                const startReference = new Date(dates[0]);
                parsedSchedule[type].dates = getCollectionDates(startReference, day, weeks);
              }
            }
          });

          setSchedule(parsedSchedule);
          setShowSearch(false);

          // Schedule notifications if enabled
          if (isNotificationEnabled()) {
            scheduleNotifications(parsedSchedule);
          }
        } catch (e) {
          console.error('Error parsing saved schedule', e);
        }
      }
    }
  }, []);

  // Debounce function to optimize API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch address suggestions
  const fetchAddressSuggestions = async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const results = await getSuggestions(text);
      if (results && results.length > 0) {
        setSuggestions(results);
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
  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchAddressSuggestions, 300),
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

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    setSchedule(null);
    setShowSuggestions(false);

    try {
      let location;

      // If we have a magicKey from suggestion, use it directly
      if (selectedMagicKey) {
        location = await getGeocodeByMagicKey(selectedMagicKey);
      } else {
        // Fallback to regular address search
        location = await getGeocodeByAddress(address);
      }

      const properties = await getWasteCollection(location);

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

      // Schedule notifications if enabled
      if (isNotificationEnabled()) {
        scheduleNotifications(newSchedule);
      }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Header
          savedAddress={savedAddress}
          showSearch={showSearch}
          isMobile={isMobile}
          onChangeAddress={handleChangeAddress}
        />

        {showSearch && (
          <SearchBar
            address={address}
            onAddressChange={handleAddressChange}
            onKeyPress={handleKeyPress}
            onSearch={fetchSchedule}
            loading={loading}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            onSuggestionSelect={handleSuggestionClick}
            loadingSuggestions={loadingSuggestions}
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {schedule && (
          <>
            <NotificationSettings schedule={schedule} />
            <ScheduleDisplay schedule={schedule} />
          </>
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
