import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isValid: boolean;
  strength: 'weak' | 'fair' | 'strong';
  strengthLabel: string;
  strengthColor: string;
  strengthPercent: number;
  firstMissingError?: string;
}

/**
 * Evaluates password against user-friendly student policy:
 * - Minimum 8 characters
 * - At least 1 letter
 * - At least 1 number
 * Special characters and uppercase letters are optional.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const cleanPassword = password || '';
  const hasMinLength = cleanPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(cleanPassword);
  const hasNumber = /[0-9]/.test(cleanPassword);

  // Strength score
  const hasUpper = /[A-Z]/.test(cleanPassword);
  const hasLower = /[a-z]/.test(cleanPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(cleanPassword);
  const isLonger = cleanPassword.length >= 10;

  let bonus = 0;
  if (hasUpper && hasLower) bonus += 1;
  if (hasSpecial) bonus += 1;
  if (isLonger) bonus += 1;

  let strength: 'weak' | 'fair' | 'strong' = 'weak';
  let strengthLabel = 'Weak';
  let strengthColor = '#64748b'; // neutral when empty
  let strengthPercent = 0;

  if (!cleanPassword) {
    strength = 'weak';
    strengthLabel = 'Weak';
    strengthColor = '#64748b';
    strengthPercent = 0;
  } else if (!hasMinLength || (!hasLetter && !hasNumber)) {
    strength = 'weak';
    strengthLabel = 'Weak';
    strengthColor = '#ef4444';
    strengthPercent = 25;
  } else if (hasMinLength && hasLetter && hasNumber) {
    if (bonus >= 2 || cleanPassword.length >= 12) {
      strength = 'strong';
      strengthLabel = 'Strong';
      strengthColor = '#22c55e'; // green
      strengthPercent = 100;
    } else {
      strength = 'fair';
      strengthLabel = 'Fair';
      strengthColor = '#f59e0b'; // amber
      strengthPercent = 65;
    }
  } else {
    // 8+ chars but missing letter or number
    strength = 'weak';
    strengthLabel = 'Weak';
    strengthColor = '#f97316';
    strengthPercent = 40;
  }

  let firstMissingError: string | undefined;
  if (!cleanPassword) {
    firstMissingError = 'Please enter a password.';
  } else if (!hasMinLength) {
    firstMissingError = 'Your password must contain at least 8 characters.';
  } else if (!hasLetter) {
    firstMissingError = 'Add at least one letter to your password.';
  } else if (!hasNumber) {
    firstMissingError = 'Add at least one number to your password.';
  }

  return {
    hasMinLength,
    hasLetter,
    hasNumber,
    isValid: hasMinLength && hasLetter && hasNumber,
    strength,
    strengthLabel,
    strengthColor,
    strengthPercent,
    firstMissingError,
  };
}

/**
 * Parses Clerk auth error objects into clear, human-readable student messages.
 */
export function parseClerkAuthError(err: any): string {
  const clerkErr = err?.errors?.[0];
  if (!clerkErr) {
    return err?.message || 'Authentication error. Please retry.';
  }

  switch (clerkErr.code) {
    case 'form_password_length_too_short':
      return 'Your password must contain at least 8 characters.';
    case 'form_password_pwned':
      return 'This password has been detected in a public data breach. For your security, please choose a different password.';
    case 'form_password_validation_failed':
      return (
        clerkErr.longMessage ||
        clerkErr.message ||
        'This password does not meet the password requirements configured for your account.'
      );
    case 'form_password_incorrect':
      return 'Incorrect password. Please verify and try again, or use Forgot Password.';
    case 'form_identifier_not_found':
      return 'No student account found with this email. Tap Register to create one.';
    case 'form_identifier_exists':
      return 'An account with this email already exists. Please log in.';
    case 'form_code_incorrect':
      return 'Incorrect verification code. Please check your email.';
    case 'verification_expired':
      return 'Verification code has expired. Please tap Resend Code.';
    default:
      return clerkErr.longMessage || clerkErr.message || 'Authentication error.';
  }
}

interface PasswordRequirementsViewProps {
  password: string;
  showStrength?: boolean;
}

export const PasswordRequirementsView: React.FC<PasswordRequirementsViewProps> = ({
  password,
  showStrength = true,
}) => {
  const validation = validatePassword(password);
  const hasTyped = password.length > 0;

  return (
    <View style={styles.container}>
      {/* Strength Indicator */}
      {showStrength && hasTyped && (
        <View style={styles.strengthSection}>
          <View style={styles.strengthHeader}>
            <Text style={styles.strengthHeading}>Password strength:</Text>
            <Text style={[styles.strengthBadgeText, { color: validation.strengthColor }]}>
              {validation.strengthLabel}
            </Text>
          </View>
          <View style={styles.strengthTrack}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${validation.strengthPercent}%`,
                  backgroundColor: validation.strengthColor,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Clear Requirements Checklist */}
      <View style={styles.requirementsBox}>
        <Text style={styles.requirementsTitle}>Password requirements:</Text>

        {/* 1. At least 8 characters */}
        <View style={styles.reqRow}>
          {validation.hasMinLength ? (
            <CheckCircle2 size={15} color="#22c55e" style={styles.reqIcon} />
          ) : (
            <Circle size={15} color="#64748b" style={styles.reqIcon} />
          )}
          <Text
            style={[
              styles.reqText,
              validation.hasMinLength ? styles.reqTextActive : styles.reqTextInactive,
            ]}
          >
            At least 8 characters
          </Text>
        </View>

        {/* 2. Contains a letter */}
        <View style={styles.reqRow}>
          {validation.hasLetter ? (
            <CheckCircle2 size={15} color="#22c55e" style={styles.reqIcon} />
          ) : (
            <Circle size={15} color="#64748b" style={styles.reqIcon} />
          )}
          <Text
            style={[
              styles.reqText,
              validation.hasLetter ? styles.reqTextActive : styles.reqTextInactive,
            ]}
          >
            Contains a letter
          </Text>
        </View>

        {/* 3. Contains a number */}
        <View style={styles.reqRow}>
          {validation.hasNumber ? (
            <CheckCircle2 size={15} color="#22c55e" style={styles.reqIcon} />
          ) : (
            <Circle size={15} color="#64748b" style={styles.reqIcon} />
          )}
          <Text
            style={[
              styles.reqText,
              validation.hasNumber ? styles.reqTextActive : styles.reqTextInactive,
            ]}
          >
            Contains a number
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  strengthSection: {
    marginBottom: 10,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  strengthHeading: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  strengthBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  strengthTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirementsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  requirementsTitle: {
    fontSize: 11.5,
    color: '#cbd5e1',
    fontWeight: '600',
    marginBottom: 7,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reqIcon: {
    marginRight: 7,
  },
  reqText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  reqTextActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  reqTextInactive: {
    color: '#94a3b8',
  },
});
