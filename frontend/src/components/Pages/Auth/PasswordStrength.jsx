import React from 'react';

/**
 * Analyze password and return score (0-4) and feedback.
 */
function getPasswordStrength(password) {
  let score = 0;
  const feedback = [];

  if (!password) return { score: 0, feedback: ['Password is required'] };

  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('One lowercase letter');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('One uppercase letter');

  if (/\d/.test(password)) score += 1;
  else feedback.push('One number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('One special character');

  // Clamp score to 0-4 for consistent bar display
  const barScore = Math.min(score, 4);

  return { score: barScore, feedback };
}

function getStrengthLabel(score) {
  switch (score) {
    case 0:
    case 1:
      return { text: 'Weak', className: 'strength-weak' };
    case 2:
      return { text: 'Medium', className: 'strength-medium' };
    case 3:
      return { text: 'Strong', className: 'strength-strong' };
    case 4:
      return { text: 'Very Strong', className: 'strength-strong' };
    default:
      return { text: '', className: '' };
  }
}

export default function PasswordStrength({ password }) {
  const { score, feedback } = getPasswordStrength(password);
  const { text, className } = getStrengthLabel(score);

  // Bar width: 0%, 25%, 50%, 75%, 100%
  const barWidth = `${(score / 4) * 100}%`;

  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div
          className={`strength-fill ${className}`}
          style={{ width: barWidth }}
        />
      </div>
      <div className={`strength-text ${className}`}>{text}</div>
      {feedback.length > 0 && password && (
        <div className="strength-feedback">
          <ul>
            {feedback.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
