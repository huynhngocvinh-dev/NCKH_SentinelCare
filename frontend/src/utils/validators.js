// Simple, dependency-free form validation helpers.

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

// Vietnamese mobile numbers: 0xxxxxxxxx (10 digits) or +84xxxxxxxxx
export const isValidPhone = (value) =>
  /^(0|\+?84)(3|5|7|8|9)[0-9]{8}$/.test(String(value || '').trim())

export const isStrongPassword = (value) =>
  // At least 8 chars, 1 letter, 1 number
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(value || ''))

export function validateRegisterForm(values) {
  const errors = {}

  if (!values.fullName?.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.'
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = 'Họ và tên quá ngắn.'
  }

  if (!values.email?.trim()) {
    errors.email = 'Vui lòng nhập email.'
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Email không hợp lệ.'
  }

  if (!values.phone?.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại.'
  } else if (!isValidPhone(values.phone)) {
    errors.phone = 'Số điện thoại không hợp lệ.'
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  } else if (!isStrongPassword(values.password)) {
    errors.password = 'Mật khẩu tối thiểu 8 ký tự, gồm chữ và số.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Vui lòng nhập lại mật khẩu.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Mật khẩu nhập lại không khớp.'
  }

  if (!values.agreeTerms) {
    errors.agreeTerms = 'Bạn cần đồng ý với điều khoản dịch vụ.'
  }

  return errors
}

export function validateLoginForm(values) {
  const errors = {}

  if (!values.identifier?.trim()) {
    errors.identifier = 'Vui lòng nhập email hoặc số điện thoại.'
  } else if (
    !isValidEmail(values.identifier) &&
    !isValidPhone(values.identifier)
  ) {
    errors.identifier = 'Email hoặc số điện thoại không hợp lệ.'
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  }

  return errors
}

export function validateOtpForm(values) {
  const errors = {}
  if (!values.otp || values.otp.length !== 6) {
    errors.otp = 'Vui lòng nhập đủ 6 số mã OTP.'
  } else if (!/^\d{6}$/.test(values.otp)) {
    errors.otp = 'Mã OTP chỉ gồm chữ số.'
  }
  return errors
}
