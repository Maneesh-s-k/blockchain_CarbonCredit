const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // ✅ FIXED: createTransport (not createTransporter)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });
    
    this.fromEmail = `"Energy Exchange" <${process.env.GMAIL_USER}>`;
  }

  async sendOTPEmail(email, username, otp) {
    try {
      console.log(`📧 Attempting to send OTP email to: ${email}`);
      
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Your Energy Exchange Verification Code',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; overflow: hidden;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; text-align: center;">
              <h1 style="color: #00ffff; font-size: 28px; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);">⚡ Energy Exchange</h1>
              <p style="color: #ffffff; font-size: 16px; margin-bottom: 30px;">Renewable Energy Trading Platform</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.95); padding: 40px; margin: 20px; border-radius: 10px;">
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Hi ${username},</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Your verification code is:</p>
              
              <div style="background: linear-gradient(135deg, #00ffff, #ffffff); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);">
                <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${otp}</span>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Energy Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Gmail OTP email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Gmail OTP error:', error);
      throw error;
    }
  }

  async sendPasswordResetOTP(email, username, otp) {
    try {
      console.log(`📧 Attempting to send password reset OTP to: ${email}`);
      
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your Energy Exchange Password',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; overflow: hidden;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; text-align: center;">
              <h1 style="color: #00ffff; font-size: 28px; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);">⚡ Energy Exchange</h1>
              <p style="color: #ffffff; font-size: 16px; margin-bottom: 30px;">Renewable Energy Trading Platform</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.95); padding: 40px; margin: 20px; border-radius: 10px;">
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Hi ${username},</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">You requested to reset your password. Your verification code is:</p>
              
              <div style="background: linear-gradient(135deg, #ff6b6b, #ffa500); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);">
                <span style="font-size: 32px; font-weight: bold; color: #fff; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${otp}</span>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">This code will expire in 10 minutes for security reasons.</p>
              <p style="color: #ff6b6b; font-size: 14px; line-height: 1.6; margin-bottom: 20px;"><strong>⚠️ If you didn't request this password reset, please ignore this email and your password will remain unchanged.</strong></p>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Energy Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Gmail password reset email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Gmail password reset error:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, username, verificationUrl) {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Verify Your Energy Exchange Account',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; overflow: hidden;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; text-align: center;">
              <h1 style="color: #00ffff; font-size: 28px; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);">⚡ Energy Exchange</h1>
              <p style="color: #ffffff; font-size: 16px; margin-bottom: 30px;">Renewable Energy Trading Platform</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.95); padding: 40px; margin: 20px; border-radius: 10px;">
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome ${username}!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Thank you for joining our energy trading platform. To complete your registration, please verify your email address by clicking the button below.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: linear-gradient(135deg, #00ffff, #ffffff); color: #333; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);">Verify Email Address</a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #00ffff; font-size: 14px; word-break: break-all; margin-bottom: 20px;">${verificationUrl}</p>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Energy Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Gmail verification email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Gmail verification error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to Energy Exchange!',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; overflow: hidden;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; text-align: center;">
              <h1 style="color: #00ffff; font-size: 28px; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);">⚡ Energy Exchange</h1>
              <p style="color: #ffffff; font-size: 16px; margin-bottom: 30px;">Renewable Energy Trading Platform</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.95); padding: 40px; margin: 20px; border-radius: 10px;">
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome ${username}! 🎉</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Your email has been verified successfully! You can now access all features of our platform:</p>
              
              <ul style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px; text-align: left;">
                <li>⚡ Trade renewable energy with other users</li>
                <li>📊 Monitor your energy generation and consumption</li>
                <li>💰 Earn from your excess solar/wind energy</li>
                <li>🌱 Contribute to a sustainable future</li>
              </ul>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Energy Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Gmail welcome email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Gmail welcome error:', error);
      throw error;
    }
  }

  async sendSecurityAlert(email, username, alertType, details) {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Security Alert - Energy Exchange',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); border-radius: 15px; overflow: hidden;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin-bottom: 10px; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">⚠️ Security Alert</h1>
              <p style="color: #ffffff; font-size: 16px; margin-bottom: 30px;">Energy Exchange Platform</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.95); padding: 40px; margin: 20px; border-radius: 10px;">
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Hi ${username},</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">We detected a security event on your account:</p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 30px 0;">
                <p style="color: #856404; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${alertType}</p>
                <p style="color: #856404; font-size: 16px; margin: 0;"><strong>Details:</strong> ${details}</p>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">If this was you, no action is needed. If you didn't authorize this activity, please secure your account immediately.</p>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Energy Exchange. All rights reserved.</p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Gmail security alert sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Gmail security alert error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
