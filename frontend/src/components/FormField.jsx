import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

/**
 * A labeled input with an optional left icon, error message, and
 * optional password-visibility toggle. Fully controlled.
 */
export default function FormField({
  label,
  name,
  type = 'text',
  icon: Icon,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  autoComplete,
  maxLength,
  rightAdornment,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="shrink-0 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
          </button>
        )}
        {rightAdornment}
      </div>

      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
