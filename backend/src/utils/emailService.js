const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

class EmailService {
  constructor() {
    this.mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    });
    this.fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'noreply@test-zxk54v879m1ljy6v.mlsender.net';
    this.fromName = 'Energy Exchange';
  }

  // Send OTP email for verification
  async sendOTPEmail(email, username, otp) {
    try {
      const emailParams = new EmailParams()
        .setFrom(new Sender(this.fromEmail, this.fromName))
        .setTo([new Recipient(email, username)])
        .setSubject('Your Energy Exchange Verification Code')
        .setHtml(`
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; border-radius: 10px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #38bdf8; margin: 0; font-size: 28px;">⚡ Energy Exchange</h1>
            </div>
            
            <div style="background: #1e293b; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #38bdf8; text-align: center; margin-top: 0;">Email Verification</h2>
              <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 20px;">Hi ${username},</p>
              <p style="color: #cbd5e1; margin-bottom: 25px;">Your verification code is:</p>
              
              <div style="background: #0f172a; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #38bdf8;">
                <h1 style="color: #38bdf8; font-size: 36px; letter-spacing: 4px; margin: 0; font-weight: bold;">${otp}</h1>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 25px; margin-bottom: 0;">
                This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                © 2025 Energy Exchange. All rights reserved.
              </p>
            </div>
          </div>
        `)
        .setText(`
          Energy Exchange - Email Verification
          
          Hi ${username},
          
          Your verification code is: ${otp}
          
          This code will expire in 10 minutes.
          
          If you didn't request this verification, please ignore this email.
          
          © 2025 Energy Exchange
        `);

      const response = await this.mailerSend.email.send(emailParams);
      console.log('✅ OTP email sent successfully via MailerSend');
      return response;
    } catch (error) {
      console.error('❌ MailerSend OTP error:', error);
      throw error;
    }
  }

  // Send email verification (link-based)
  async sendEmailVerification(email, username, verificationToken) {
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
      
      const emailParams = new EmailParams()
        .setFrom(new Sender(this.fromEmail, this.fromName))
        .setTo([new Recipient(email, username)])
        .setSubject('Verify Your Email - Energy Exchange')
        .setHtml(`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚡ Energy Exchange</h1>
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
                © 2025 Energy Exchange. All rights reserved.
              </p>
            </div>
          </div>
        `);

      const response = await this.mailerSend.email.send(emailParams);
      console.log('✅ Email verification sent successfully via MailerSend to:', email);
      return response;
    } catch (error) {
      console.error('❌ MailerSend verification error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send password reset email
 // Send password reset OTP email
async sendPasswordResetOTP(email, username, otp) {
  try {
    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(email, username)])
      .setSubject('Password Reset Code - Energy Exchange')
      .setHtml(`
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; border-radius: 10px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ef4444; margin: 0; font-size: 28px;">🔒 Password Reset</h1>
          </div>
          
          <div style="background: #1e293b; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #ef4444; text-align: center; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #cbd5e1; font-size: 16px; margin-bottom: 20px;">Hi ${username},</p>
            <p style="color: #cbd5e1; margin-bottom: 25px;">You requested to reset your password. Your verification code is:</p>
            
            <div style="background: #0f172a; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #ef4444;">
              <h1 style="color: #ef4444; font-size: 36px; letter-spacing: 4px; margin: 0; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 25px; margin-bottom: 15px;">
              This code will expire in 10 minutes for security reasons.
            </p>
            
            <p style="color: #fbbf24; font-size: 14px; text-align: center; margin-bottom: 0;">
              ⚠️ If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              © 2025 Energy Exchange. All rights reserved.
            </p>
          </div>
        </div>
      `)
      .setText(`
        Energy Exchange - Password Reset
        
        Hi ${username},
        
        You requested to reset your password. Your verification code is: ${otp}
        
        This code will expire in 10 minutes for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        © 2025 Energy Exchange
      `);

    const response = await this.mailerSend.email.send(emailParams);
    console.log('✅ Password reset OTP email sent successfully via MailerSend');
    return response;
  } catch (error) {
    console.error('❌ MailerSend password reset OTP error:', error);
    throw error;
  }
}

  // Send welcome email after verification
  async sendWelcomeEmail(email, username) {
    try {
      const emailParams = new EmailParams()
        .setFrom(new Sender(this.fromEmail, this.fromName))
        .setTo([new Recipient(email, username)])
        .setSubject('Welcome to Energy Exchange! 🎉')
        .setHtml(`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Welcome to Energy Exchange!</h1>
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
                © 2025 Energy Exchange. All rights reserved.
              </p>
            </div>
          </div>
        `);

      const response = await this.mailerSend.email.send(emailParams);
      console.log('✅ Welcome email sent successfully via MailerSend to:', email);
      return response;
    } catch (error) {
      console.error('❌ MailerSend welcome email error:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // Send security alert email
  async sendSecurityAlert(email, username, alertType, details) {
    try {
      const emailParams = new EmailParams()
        .setFrom(new Sender(this.fromEmail, this.fromName))
        .setTo([new Recipient(email, username)])
        .setSubject(`Security Alert - ${alertType}`)
        .setHtml(`
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
                © 2025 Energy Exchange. All rights reserved.
              </p>
            </div>
          </div>
        `);

      const response = await this.mailerSend.email.send(emailParams);
      console.log('✅ Security alert email sent successfully via MailerSend to:', email);
      return response;
    } catch (error) {
      console.error('❌ MailerSend security alert error:', error);
      throw new Error('Failed to send security alert email');
    }
  }
}

module.exports = EmailService;
