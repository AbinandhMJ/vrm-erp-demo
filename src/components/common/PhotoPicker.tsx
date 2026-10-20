import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { resizePhoto } from '../../lib/photo';

/** Passport photo picker: choose from files or take one with the phone camera; stored as a small JPEG. */
export const PhotoPicker: React.FC<{
  value?: string;
  onChange: (photo: string | undefined) => void;
  alt: string;
  label?: string;
  size?: 'sm' | 'md';
}> = ({ value, onChange, alt, label = 'Add passport photo', size = 'md' }) => {
  const [error, setError] = useState('');
  const box = size === 'sm' ? 'w-24 h-30' : 'w-32 h-40';
  return (
    <div>
      <label
        className={`block ${box} rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 overflow-hidden cursor-pointer hover:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500`}
      >
        {value ? (
          <img src={value} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="h-full flex flex-col items-center justify-center text-center text-[11px] text-slate-500 px-2">
            <Camera className="w-5 h-5 mb-1" />
            {label}
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          aria-label={label}
          className="sr-only"
          onChange={async e => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              onChange(await resizePhoto(f));
              setError('');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not use this image.');
            }
          }}
        />
      </label>
      {value && (
        <button type="button" onClick={() => onChange(undefined)} className="mt-1 text-[11px] text-rose-600 hover:underline">
          Remove photo
        </button>
      )}
      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
};

/** Round avatar: photo if there is one, otherwise the initial. */
export const Avatar: React.FC<{ photo?: string; name: string; className?: string }> = ({ photo, name, className = 'w-10 h-10' }) =>
  photo ? (
    <img src={photo} alt={name} className={`${className} rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0`} />
  ) : (
    <span
      className={`${className} rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0`}
    >
      {name.replace(/^(Dr|Col|Mr|Mrs|Ms)\.?\s+/i, '').charAt(0)}
    </span>
  );
