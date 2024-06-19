import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

interface GooglePlacesInputProps {
  proxyUrl: string;
}

const GooglePlacesInput: React.FC<GooglePlacesInputProps> = ({ proxyUrl }) => {
  return (
    <GooglePlacesAutocomplete
      placeholder="Search"
      onPress={(data, details = null) => {
        // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      query={{
        language: 'en',
      }}
      requestUrl={{
        useOnPlatform: 'all',
        url: proxyUrl, // your proxy URL
        // headers: {
        //   Authorization: `an auth token`, // if required for your proxy
        // },
      }}
    />
  );
};

export default GooglePlacesInput;
