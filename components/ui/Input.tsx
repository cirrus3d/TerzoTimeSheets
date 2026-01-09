'use client';

import { ChangeEvent, forwardRef } from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'date' | 'time';
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ type = 'text', value, onChange, placeholder, required, disabled, className = '', name }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        name={name}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white text-gray-900 placeholder-gray-500 ${className}`}
      />
    );
  }
);

Input.displayName = 'Input';
