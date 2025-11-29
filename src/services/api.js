const GEOCODER_URL = 'https://corp-geo.mapshare.vic.gov.au/arcgis/rest/services/Geocoder/VMAddressEZIAdd/GeocodeServer';
const WASTE_API_URL = 'https://services3.arcgis.com/TJxZpUnYIJOvcYwE/arcgis/rest/services/Waste_Collection_Zones/FeatureServer/0';

export const getSuggestions = async (text) => {
    const suggestUrl = `${GEOCODER_URL}/suggest?searchExtent=145.36,-37.86,145.78,-38.34&location=145.57,-38.1&text=${encodeURIComponent(text)}&f=json&maxSuggestions=15`;
    const response = await fetch(suggestUrl);
    const data = await response.json();
    return data.suggestions || [];
};

export const getGeocodeByMagicKey = async (magicKey) => {
    const geocodeUrl = `${GEOCODER_URL}/findAddressCandidates?magicKey=${magicKey}&f=json`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Address not found. Please select an address from the suggestions.');
    }

    return data.candidates[0].location;
};

export const getGeocodeByAddress = async (address) => {
    const geocodeUrl = `${GEOCODER_URL}/findAddressCandidates?SingleLine=${encodeURIComponent(address)}&f=json`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Address not found. Please check your address and try again.');
    }

    return data.candidates[0].location;
};

export const getWasteCollection = async (location) => {
    const wasteUrl = `${WASTE_API_URL}/query?f=geojson&outFields=*&returnGeometry=true&inSR=4326&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryPoint&geometry=${location.x},${location.y}`;
    const response = await fetch(wasteUrl);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
        throw new Error('No collection schedule found for this address.');
    }

    return data.features[0].properties;
};
