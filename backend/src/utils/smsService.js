const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  // Send phone verification code
  async sendPhoneVerification(phoneNumber, verificationCode, username) {
    try {
      const message = `Hi ${username}! Your Energy Trading Platform verification code is: ${verificationCode}. This code expires in 5 minutes. Don't share this code with anyone.`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log('Phone verification SMS sent successfully:', result.sid);
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Twilio phone verification error:', error);
      throw new Error(`Failed to send verification SMS: ${error.message}`);
    }
  }

  // Send security alert SMS
  async sendSecurityAlert(phoneNumber, username, alertType) {
    try {
      const message = `🔐 SECURITY ALERT: ${alertType} detected on your Energy Trading account (${username}). If this wasn't you, please secure your account immediately.`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log('Security alert SMS sent successfully:', result.sid);
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Twilio security alert error:', error);
      throw new Error(`Failed to send security alert SMS: ${error.message}`);
    }
  }

  // Send password reset notification
  async sendPasswordResetNotification(phoneNumber, username) {
    try {
      const message = `🔒 Password reset requested for your Energy Trading account (${username}). Check your email for reset instructions. If this wasn't you, please contact support.`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log('Password reset notification SMS sent successfully:', result.sid);
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Twilio password reset notification error:', error);
      throw new Error(`Failed to send password reset notification SMS: ${error.message}`);
    }
  }

  // Send trading notification
  async sendTradingNotification(phoneNumber, username, orderType, amount, price) {
    try {
      const message = `💰 Trading Update: Your ${orderType} order for ${amount} kWh at $${price}/kWh has been processed. Check your Energy Trading dashboard for details.`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log('Trading notification SMS sent successfully:', result.sid);
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Twilio trading notification error:', error);
      throw new Error(`Failed to send trading notification SMS: ${error.message}`);
    }
  }

  // Send welcome SMS
  async sendWelcomeSMS(phoneNumber, username) {
    try {
      const message = `🎉 Welcome to Energy Trading Platform, ${username}! Your phone number has been verified. Start trading clean energy today!`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log('Welcome SMS sent successfully:', result.sid);
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Twilio welcome SMS error:', error);
      throw new Error(`Failed to send welcome SMS: ${error.message}`);
    }
  }
}

module.exports = new SMSService();
