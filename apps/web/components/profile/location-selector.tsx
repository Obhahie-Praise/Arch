"use client";

import React, { useMemo } from "react";
import { Country, State, City } from "country-state-city";
import { CustomDropdown, DropdownOption } from "./custom-dropdown";

interface LocationSelectorProps {
  country: string;
  state: string;
  city: string;
  timezone: string;
  onCountryChange: (countryName: string, isoCode: string) => void;
  onStateChange: (stateName: string, stateCode: string) => void;
  onCityChange: (cityName: string) => void;
  onTimezoneChange: (tz: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  country,
  state,
  city,
  timezone,
  onCountryChange,
  onStateChange,
  onCityChange,
  onTimezoneChange,
}) => {
  // Get all countries
  const countries = useMemo<DropdownOption[]>(() => {
    return Country.getAllCountries().map((c) => ({
      label: c.name,
      value: c.isoCode,
    }));
  }, []);

  // Find ISO code for current country name or isoCode
  const selectedCountryObj = useMemo(() => {
    if (!country) return null;
    return (
      Country.getAllCountries().find(
        (c) => c.isoCode === country || c.name.toLowerCase() === country.toLowerCase()
      ) || null
    );
  }, [country]);

  const countryIso = selectedCountryObj?.isoCode || "";

  // Get states for selected country
  const states = useMemo<DropdownOption[]>(() => {
    if (!countryIso) return [];
    return State.getStatesOfCountry(countryIso).map((s) => ({
      label: s.name,
      value: s.isoCode,
    }));
  }, [countryIso]);

  const selectedStateObj = useMemo(() => {
    if (!countryIso || !state) return null;
    return (
      State.getStatesOfCountry(countryIso).find(
        (s) => s.isoCode === state || s.name.toLowerCase() === state.toLowerCase()
      ) || null
    );
  }, [countryIso, state]);

  const stateCode = selectedStateObj?.isoCode || "";

  // Get cities for selected state & country
  const cities = useMemo<DropdownOption[]>(() => {
    if (!countryIso) return [];
    if (stateCode) {
      return City.getCitiesOfState(countryIso, stateCode).map((c) => ({
        label: c.name,
        value: c.name,
      }));
    }
    return City.getCitiesOfCountry(countryIso)?.map((c) => ({
      label: c.name,
      value: c.name,
    })) || [];
  }, [countryIso, stateCode]);

  const handleCountrySelect = (iso: string) => {
    const cObj = Country.getCountryByCode(iso);
    if (cObj) {
      onCountryChange(cObj.name, cObj.isoCode);
      onStateChange("", "");
      onCityChange("");
      // Timezone resolution
      const timezones = cObj.timezones || [];
      if (timezones.length > 0 && timezones[0]?.zoneName) {
        onTimezoneChange(timezones[0].zoneName);
      }
    }
  };

  const handleStateSelect = (sIso: string) => {
    if (!countryIso) return;
    const sObj = State.getStateByCodeAndCountry(sIso, countryIso);
    if (sObj) {
      onStateChange(sObj.name, sObj.isoCode);
      onCityChange("");
    }
  };

  const handleCitySelect = (cName: string) => {
    onCityChange(cName);
    // Find city timezone if available
    if (countryIso && stateCode) {
      const cityList = City.getCitiesOfState(countryIso, stateCode);
      const cityObj = cityList.find((c) => c.name === cName);
      if (cityObj && (cityObj as any).timeZone) {
        onTimezoneChange((cityObj as any).timeZone);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <label className="font-medium text-foreground">Location</label>
        {timezone && (
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2.5 py-0.5 rounded-full">
            Timezone: {timezone}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CustomDropdown
          placeholder="Country"
          options={countries}
          value={countryIso}
          onChange={handleCountrySelect}
          searchable
        />

        <CustomDropdown
          placeholder="State / Region"
          options={states}
          value={stateCode}
          onChange={handleStateSelect}
          disabled={!countryIso || states.length === 0}
          searchable
        />

        <CustomDropdown
          placeholder="City"
          options={cities}
          value={city}
          onChange={handleCitySelect}
          disabled={!countryIso || cities.length === 0}
          searchable
        />
      </div>
    </div>
  );
};
