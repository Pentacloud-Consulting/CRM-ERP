import React from 'react';
import AsyncSelect from 'react-select/async';
import { City, Country } from 'country-state-city';

const customStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: '42px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    boxShadow: 'none',
    '&:hover': {
      border: '1px solid #CBD5E1',
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0 12px',
  }),
  input: (provided) => ({
    ...provided,
    margin: '0px',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '42px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#F1F5F9' : 'white',
    color: '#0F172A',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '10px 14px',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#0F172A',
    fontSize: '14px',
  }),
  placeholder: (provided) => ({
    ...provided,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '13px',
    color: '#94A3B8',
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
  }),
};

export default function AsyncLocationSelect({ value, onChange, placeholder = "Search for a city..." }) {
  
  // Memoize getting all cities to avoid re-evaluating the huge array too often
  const allCities = React.useMemo(() => City.getAllCities(), []);

  const loadOptions = (inputValue, callback) => {
    if (!inputValue || inputValue.length < 2) {
      callback([]);
      return;
    }

    const lowerInput = inputValue.toLowerCase();
    const filtered = [];
    
    // Performance optimization: standard loop breaks early to prevent freezing
    for (let i = 0; i < allCities.length; i++) {
      if (filtered.length >= 50) break;
      const c = allCities[i];
      if (c.name.toLowerCase().startsWith(lowerInput)) {
        filtered.push(c);
      }
    }

    const options = filtered.map(c => {
      const countryObj = Country.getCountryByCode(c.countryCode);
      const countryName = countryObj ? countryObj.name : c.countryCode;
      
      return {
        value: JSON.stringify({ name: c.name, country: countryName, code: `${c.name}, ${countryName}` }),
        label: `${c.name}, ${countryName}`
      };
    });

    callback(options);
  };

  const selectedOption = value ? {
    value,
    label: (function() {
      try { 
        const parsed = JSON.parse(value); 
        return parsed.code || value; 
      } catch { 
        return value; 
      }
    })()
  } : null;

  return (
    <AsyncSelect
      cacheOptions
      loadOptions={loadOptions}
      defaultOptions={false}
      styles={customStyles}
      placeholder={placeholder}
      value={selectedOption}
      onChange={(option) => {
        onChange(option ? option.value : '');
      }}
      noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? "Type at least 2 characters..." : "No cities found"}
    />
  );
}
