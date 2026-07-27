import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpFrom = process.env.SMTP_FROM || '"Scaffold Support" <support@scaffold.com>';
// Create transporter only if credentials are provided
let transporter = null;
if (smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });
    console.log('📬 Nodemailer SMTP transporter configured successfully');
}
else {
    console.log('⚠️ Nodemailer: SMTP credentials missing in .env. Falling back to terminal console logs for OTP delivery.');
}
export const sendOtpEmail = async (to, otp) => {
    // If SMTP is not configured, simulate success and log to console
    if (!transporter) {
        console.log(`\n==================================================`);
        console.log(`[SIMULATED EMAIL] To: ${to}`);
        console.log(`[SIMULATED EMAIL] Subject: Scaffold Verification Code`);
        console.log(`[SIMULATED EMAIL] Code: ${otp}`);
        console.log(`==================================================\n`);
        return true;
    }
    try {
        const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2d1c3; border-radius: 24px; background-color: #ffffff; color: #432c20;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="font-family: Georgia, serif; color: #4a2818; margin: 0; font-size: 24px; font-weight: bold;">Scaffold</h2>
          <p style="color: #8c7161; font-size: 14px; margin: 4px 0 0 0;">Workspace Account Recovery</p>
        </div>
        
        <div style="border-top: 1px solid #f2e9e1; padding-top: 20px;">
          <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">You requested a recovery code to reset your account password. Use the verification code below to authorize this change:</p>
          
          <div style="background-color: #fcf9f6; border: 1px solid #ebd9cb; border-radius: 16px; padding: 18px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #9c4126; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="font-size: 13px; line-height: 1.4; color: #736257; margin: 0 0 20px 0;">This code is valid for <strong>60 seconds</strong>. For security, do not share this code with anyone.</p>
        </div>
        
        <div style="border-top: 1px solid #f2e9e1; padding-top: 16px; text-align: center;">
          <p style="font-size: 12px; line-height: 1.4; color: #a69285; margin: 0;">If you did not request this recovery code, you can safely ignore this email.</p>
        </div>
      </div>
    `;
        await transporter.sendMail({
            from: smtpFrom,
            to,
            subject: 'Scaffold Password Reset Code',
            text: `Your Scaffold password reset code is: ${otp}. It will expire in 60 seconds.`,
            html: htmlContent
        });
        console.log(`✉️ OTP email successfully sent to ${to}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Failed to send OTP email to ${to}:`, error);
        // Fallback log to console so the user can still progress
        console.log(`\n[FALLBACK OUTPUT] OTP for resetting password of ${to}: ${otp}\n`);
        return false;
    }
};
//# sourceMappingURL=mailer.js.map