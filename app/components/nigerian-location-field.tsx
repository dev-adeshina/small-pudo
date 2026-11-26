'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, LoaderCircle } from 'lucide-react';

type NigerianLocation = { city: string; state: string; country: 'Nigeria' };

export default function NigerianLocationField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  const [locations, setLocations] = useState<NigerianLocation[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<NigerianLocation | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/locations/nigeria')
      .then((response) => {
        if (!response.ok) throw new Error('Location lookup unavailable');
        return response.json();
      })
      .then((data: { locations?: NigerianLocation[] }) => {
        if (active) setLocations(data.locations ?? []);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, []);

  const suggestions = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (term.length < 2) return [];
    return locations
      .filter((item) => item.city.toLocaleLowerCase().includes(term)
        || item.state.toLocaleLowerCase().includes(term))
      .sort((a, b) => {
        const aStarts = a.city.toLocaleLowerCase().startsWith(term) ? 0 : 1;
        const bStarts = b.city.toLocaleLowerCase().startsWith(term) ? 0 : 1;
        return aStarts - bStarts || a.city.localeCompare(b.city);
      })
      .slice(0, 8);
  }, [locations, query]);

  function choose(location: NigerianLocation) {
    setSelected(location);
    setQuery(location.city);
    setOpen(false);
    if (inputRef.current) {
      inputRef.current.dataset.locationValid = 'true';
      inputRef.current.setCustomValidity('');
    }
  }

  function edit(value: string) {
    setQuery(value);
    setSelected(null);
    setOpen(true);
    if (inputRef.current) {
      inputRef.current.dataset.locationValid = 'false';
      inputRef.current.setCustomValidity('');
    }
  }

  return (
    <div className="vl-location-field" ref={rootRef}>
      <label className="vl-location-city-label">
        {label} · City
        <span className="vl-location-input-wrap">
          <MapPin size={15} aria-hidden="true" />
          <input
            ref={inputRef}
            data-location-input="true"
            data-location-valid={selected ? 'true' : 'false'}
            required
            autoComplete="off"
            value={query}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(event) => edit(event.target.value)}
            onBlur={() => {
              if (!selected && query.trim()) {
                inputRef.current?.setCustomValidity('Select a city from the suggestions.');
              }
            }}
            aria-expanded={open && suggestions.length > 0}
            aria-autocomplete="list"
          />
          {loading && <LoaderCircle className="vl-location-spinner" size={15} aria-label="Loading locations" />}
        </span>
      </label>
      {open && query.trim().length >= 2 && (
        <div className="vl-location-suggestions" role="listbox" aria-label={`${label} city suggestions`}>
          {suggestions.length ? suggestions.map((item) => (
            <button
              type="button"
              role="option"
              aria-selected={selected?.city === item.city && selected?.state === item.state}
              key={`${item.city}-${item.state}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(item)}
            >
              <strong>{item.city}</strong><span>{item.state}</span>
            </button>
          )) : (
            <p>{loading ? 'Loading Nigerian cities…' : loadError ? 'Location list is temporarily unavailable. Please try again shortly.' : 'No matching city found. Try another spelling.'}</p>
          )}
        </div>
      )}
      <div className="vl-location-meta">
        <label>State<input readOnly value={selected?.state ?? ''} placeholder="Auto-filled after city selection" /></label>
        <label>Country<input readOnly value={selected?.country ?? ''} placeholder="Nigeria" /></label>
      </div>
      {selected && <span className="vl-location-confirmed">Location selected</span>}
    </div>
  );
}
