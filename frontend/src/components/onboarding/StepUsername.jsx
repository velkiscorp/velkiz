import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock, Calendar, Eye, EyeOff } from 'lucide-react';
import { differenceInYears, parseISO, isValid } from 'date-fns';

export default function StepUsername({ data, onChange }) {
  const [citySearch, setCitySearch] = useState(data.city || '');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const handleDOBChange = (val) => {
    onChange({ date_of_birth: val });
    if (val) {
      const parsed = parseISO(val);
      if (isValid(parsed)) {
        const age = differenceInYears(new Date(), parsed);
        onChange({ date_of_birth: val, age });
      }
    }
  };

  const searchCities = async (query) => {
  if (query.length < 2) { setCitySuggestions([]); return; }
  setLoadingCities(true);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1&featuretype=settlement`
    );
    const results = await res.json();
    const seen = new Set();
    const cities = results
      .filter(r => {
        const type = r.type || r.addresstype;
        return ['city', 'town', 'village', 'municipality', 'suburb', 'administrative'].includes(type) ||
               r.class === 'place' || r.class === 'boundary';
      })
      .map(r => ({
        city: r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || r.name,
        country: r.address?.country || '',
        display: r.display_name,
        // The city's centre, used for the distance filter. Never your own position.
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      }))
      .filter(c => {
        const key = `${c.city}-${c.country}`;
        if (seen.has(key) || !c.city) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
    setCitySuggestions(cities);
  } catch (e) {
    setCitySuggestions([]);
  }
  setLoadingCities(false);
};

  const searchTimeout = React.useRef(null);

const handleCityInput = (val) => {
  setCitySearch(val);
  onChange({ city: val, country: '' });
  clearTimeout(searchTimeout.current);
  searchTimeout.current = setTimeout(() => searchCities(val), 400);
};

  const selectCity = (c) => {
    setCitySearch(`${c.city}, ${c.country}`);
    setCitySuggestions([]);
    onChange({
      city: c.city,
      country: c.country,
      location_lat: Number.isFinite(c.lat) ? c.lat : null,
      location_lng: Number.isFinite(c.lng) ? c.lng : null,
    });
  };

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const minDate = '1920-01-01';

  const age = data.date_of_birth ? differenceInYears(new Date(), parseISO(data.date_of_birth)) : null;
  const ageValid = age !== null && age >= 18;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif italic font-medium">Choose your identity</h2>
        <p className="text-muted-foreground text-sm">These details are permanent and cannot be changed later.</p>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="username">Username</Label>
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
        <Input
          id="username"
          placeholder="e.g. midnight_wolf"
          value={data.username || ''}
          onChange={(e) => onChange({ username: e.target.value.toLowerCase() })}
          autoCapitalize="none"
          className="h-12 bg-secondary border-border/50 text-lg"
        />
        <p className="text-xs text-muted-foreground">Cannot be changed after sign up</p>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Lock className="w-3 h-3 text-muted-foreground" />
          <Calendar className="w-3 h-3 text-muted-foreground" />
        </div>
        <Input
          id="dob"
          type="date"
          max={maxDate}
          min={minDate}
          value={data.date_of_birth || ''}
          onChange={(e) => handleDOBChange(e.target.value)}
          className="h-12 bg-secondary border-border/50"
        />
        {age !== null && (
          <p className={`text-xs font-medium ${ageValid ? 'text-gold' : 'text-destructive'}`}>
            {ageValid ? `Age ${age} — eligible` : `You must be 18+ to join`}
          </p>
        )}

        {/* Show DOB toggle */}
        {age !== null && ageValid && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border/50 mt-2">
            <div className="flex items-center gap-2">
              {data.show_dob ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Show date of birth on profile</p>
                <p className="text-xs text-muted-foreground">Age is always visible. DOB is optional.</p>
              </div>
            </div>
            <Switch
              checked={!!data.show_dob}
              onCheckedChange={(v) => onChange({ show_dob: v })}
            />
          </div>
        )}
      </div>

      {/* City Search */}
      <div className="space-y-2 relative">
        <div className="flex items-center gap-2">
          <Label>City</Label>
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
        <Input
          placeholder="Search for your city..."
          value={citySearch}
          onChange={(e) => handleCityInput(e.target.value)}
          className="h-12 bg-secondary border-border/50"
        />
        {loadingCities && (
          <p className="text-xs text-muted-foreground px-1">Searching cities...</p>
        )}
        {citySuggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl">
            {citySuggestions.map((c, i) => (
              <button
                key={i}
                onClick={() => selectCity(c)}
                className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border/50 last:border-0"
              >
                <p className="text-sm font-medium">{c.city}</p>
                <p className="text-xs text-muted-foreground">{c.country}</p>
              </button>
            ))}
          </div>
        )}
        {data.city && data.country && (
          <p className="text-xs text-gold font-medium">✓ {data.city}, {data.country}</p>
        )}
        <p className="text-xs text-muted-foreground">City and country cannot be changed after sign up</p>
      </div>
    </div>
  );
}