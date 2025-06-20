const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  constructor() {
    // Use a verified sender email - MUST be verified in SendGrid dashboard
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';
    this.fromName = 'Energy Trading Platform';
  }

  // Send email verification
  async sendEmailVerification(email, username, verificationToken) {
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
      
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Verify Your Email - Energy Trading Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚡ Energy Trading Platform</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Welcome ${username}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for joining our energy trading platform. To complete your registration, 
                please verify your email address by clicking the button below.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; 
                          border-radius: 8px; font-weight: bold; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #22c55e;">${verificationUrl}</a>
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                This verification link will expire in 24 hours.
              </p>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                © 2025 Energy Trading Platform. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      await sgMail.send(msg);
      console.log('✅ Email verification sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('❌ SendGrid email verification error:', error);
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid error details:', error.response.body.errors);
      }
      throw new Error('Failed to send verification email');
    }
  }

  // Send password reset email
  async sendPasswordReset(email, username, resetToken) {
    try {
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Password Reset Request - Energy Trading Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔒 Password Reset</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Hello ${username},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. If you didn't make this request, 
                please ignore this email and your password will remain unchanged.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; 
                          border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #ef4444;">${resetUrl}</a>
              </p>
              <p style="color: #dc2626; font-size: 14px; font-weight: bold;">
                ⚠️ This reset link will expire in 10 minutes for security reasons.
              </p>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                © 2025 Energy Trading Platform. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      await sgMail.send(msg);
      console.log('✅ Password reset email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('❌ SendGrid password reset error:', error);
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid error details:', error.response.body.errors);
      }
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email, username) {
    try {
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Welcome to Energy Trading Platform! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Welcome to Energy Trading!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Congratulations ${username}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your email has been verified successfully! You can now access all features of our platform:
              </p>
              <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li>⚡ Register your energy devices</li>
                <li>💰 Trade energy credits</li>
                <li>📊 Monitor your energy production</li>
                <li>🔗 Connect your crypto wallet</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; 
                          border-radius: 8px; font-weight: bold; display: inline-block;">
                  Go to Dashboard
                </a>
              </div>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                © 2025 Energy Trading Platform. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      await sgMail.send(msg);
      console.log('✅ Welcome email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('❌ SendGrid welcome email error:', error);
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid error details:', error.response.body.errors);
      }
      throw new Error('Failed to send welcome email');
    }
  }

  // Send security alert email
  async sendSecurityAlert(email, username, alertType, details) {
    try {
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `Security Alert - ${alertType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔐 Security Alert</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Hello ${username},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We detected a security event on your account: <strong>${alertType}</strong>
              </p>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Details:</strong> ${details}
                </p>
              </div>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                If this was you, no action is needed. If you didn't authorize this activity, 
                please secure your account immediately.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/security" 
                   style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; 
                          border-radius: 8px; font-weight: bold; display: inline-block;">
                  Review Security Settings
                </a>
              </div>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                © 2025 Energy Trading Platform. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      await sgMail.send(msg);
      console.log('✅ Security alert email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('❌ SendGrid security alert error:', error);
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid error details:', error.response.body.errors);
      }
      throw new Error('Failed to send security alert email');
    }
  }

  async sendOTPEmail(email, username, otp) {
  try {
    const msg = {
      to: email,
      from: { 
        email: this.fromEmail,
        name: this.fromName 
      },
      subject: 'Your Verification OTP',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #2d3748;">Hello ${username},</h2>
          <p style="font-size: 16px; color: #4a5568;">
            Your verification code is: 
            <strong style="font-size: 24px; color: #4299e1;">${otp}</strong>
          </p>
          <p style="font-size: 14px; color: #718096;">
            This code will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    };
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

}

module.exports = new EmailService();
