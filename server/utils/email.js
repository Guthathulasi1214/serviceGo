const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send booking notification email to provider
 */
const sendBookingNotification = async ({ providerEmail, providerName, booking }) => {
  try {
    const transporter = createTransporter();

    const servicesList = booking.services
      .map((s) => `• ${s.service?.name || 'Service'} (×${s.quantity}) — ₹${s.price}`)
      .join('\n');

    const address = booking.address;
    const addressStr = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
    const scheduledDate = new Date(booking.scheduledDate).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #ec4899); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🔧 ServiceGo</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">New Booking Alert!</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 22px;">Hi ${providerName} 👋</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
            You have a <strong>new service booking</strong>! Please review the details below and prepare for the service.
          </p>

          <!-- Booking Details Card -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <h3 style="color: #6366f1; margin: 0 0 16px; font-size: 16px;">📋 Booking Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Booking ID</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">#${booking._id.toString().slice(-8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Customer</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${booking.consumer?.name || 'Customer'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${booking.consumer?.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Scheduled</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${scheduledDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-transform: uppercase;">${booking.paymentMethod}</td>
              </tr>
            </table>
          </div>

          <!-- Address Card -->
          <div style="background: #eef2ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #c7d2fe;">
            <h3 style="color: #4338ca; margin: 0 0 8px; font-size: 16px;">📍 Service Location</h3>
            <p style="color: #3730a3; margin: 0; font-size: 15px; font-weight: 600; line-height: 1.5;">
              ${addressStr}
            </p>
          </div>

          <!-- Services -->
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
            <h3 style="color: #166534; margin: 0 0 12px; font-size: 16px;">🧰 Services Requested</h3>
            ${booking.services.map((s) => `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
                <span style="color: #15803d;">${s.service?.name || 'Service'} × ${s.quantity}</span>
                <span style="color: #166534; font-weight: 700;">₹${s.price}</span>
              </div>
            `).join('')}
            <div style="border-top: 2px solid #86efac; margin-top: 12px; padding-top: 12px; display: flex; justify-content: space-between;">
              <span style="color: #166534; font-weight: 800; font-size: 16px;">Total</span>
              <span style="color: #166534; font-weight: 800; font-size: 18px;">₹${booking.totalAmount}</span>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">
              Please share your live location when heading to the service location.
            </p>
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Log in to your ServiceGo provider dashboard to manage this booking.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ServiceGo • Powered by technology
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"ServiceGo" <${process.env.EMAIL_USER}>`,
      to: providerEmail,
      subject: `🔧 New Booking! Service requested at ${address.city}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send booking email:', error.message);
    // Don't throw — email failure shouldn't block the booking
  }
};

/**
 * Send booking confirmation email to consumer
 */
const sendBookingConfirmation = async ({ consumerEmail, consumerName, booking }) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #6366f1, #ec4899); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🔧 ServiceGo</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Booking Confirmed! ✅</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1e293b; margin: 0 0 16px;">Hi ${consumerName} 👋</h2>
          <p style="color: #475569; line-height: 1.6;">
            Your booking <strong>#${booking._id.toString().slice(-8).toUpperCase()}</strong> has been confirmed!
            A service provider will be assigned shortly. You'll receive updates and can track your provider live.
          </p>
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 800; text-align: center;">
              Total: ₹${booking.totalAmount}
            </p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13px; text-align: center; text-transform: uppercase;">
              Payment: ${booking.paymentMethod}
            </p>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ServiceGo</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"ServiceGo" <${process.env.EMAIL_USER}>`,
      to: consumerEmail,
      subject: `✅ Booking Confirmed! #${booking._id.toString().slice(-8).toUpperCase()}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to consumer');
  } catch (error) {
    console.error('Failed to send confirmation email:', error.message);
  }
};

/**
 * Send OTP email to consumer for service completion verification
 */
const sendOTPEmail = async ({ consumerEmail, consumerName, consumerPhone, otp, booking }) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🔐 ServiceGo</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Service Completion OTP</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <h2 style="color: #1e293b; margin: 0 0 16px;">Hi ${consumerName} 👋</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
            Your service provider has <strong>completed the work</strong> for booking 
            <strong>#${booking._id.toString().slice(-8).toUpperCase()}</strong>. 
            Please share this OTP with the provider to confirm completion:
          </p>
          
          <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 16px; padding: 32px; margin: 24px 0;">
            <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Your Verification OTP</p>
            <p style="color: white; font-size: 48px; font-weight: 900; margin: 0; letter-spacing: 12px;">${otp}</p>
          </div>
          
          <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin: 16px 0;">
            ⚠️ Do NOT share this OTP with anyone except your service provider standing at your door.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This OTP expires in 30 minutes.
          </p>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ServiceGo</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"ServiceGo" <${process.env.EMAIL_USER}>`,
      to: consumerEmail,
      subject: `🔐 OTP ${otp} — Confirm Service Completion | ServiceGo`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to consumer');
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
  }
};

/**
 * Generate WhatsApp message link with OTP
 */
const getWhatsAppOTPLink = (phone, otp, bookingId) => {
  const message = encodeURIComponent(
    `🔐 *ServiceGo OTP*\n\nYour service completion OTP is: *${otp}*\n\nBooking: #${bookingId}\n\n⚠️ Share this only with your service provider.\nThis OTP expires in 30 minutes.`
  );
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phone?.replace(/[^0-9+]/g, '') || '';
  return `https://wa.me/${cleanPhone}?text=${message}`;
};

/**
 * Send service approval notification email to provider
 */
const sendServiceApprovalEmail = async ({ providerEmail, providerName, service }) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🎉 ServiceGo</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Service Approved!</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <h2 style="color: #1e293b; margin: 0 0 16px;">Congratulations, ${providerName}! 🎊</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
            Great news! Your service has been <strong style="color: #16a34a;">approved</strong> by the ServiceGo admin team 
            and is now <strong>live on the platform</strong>.
          </p>
          
          <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 16px; padding: 24px; margin: 24px 0;">
            <p style="color: #166534; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Approved Service</p>
            <p style="color: #15803d; font-size: 24px; font-weight: 900; margin: 0;">${service.name}</p>
            <p style="color: #22c55e; font-size: 14px; margin: 8px 0 0; text-transform: capitalize;">${service.category} • ₹${service.price} • ${service.duration} min</p>
          </div>
          
          <p style="color: #475569; font-size: 14px; margin: 16px 0;">
            Customers can now discover and book your service. Keep your dashboard active to receive booking notifications!
          </p>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/provider" 
             style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 16px;">
            Go to Dashboard →
          </a>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ServiceGo — Your trusted local services marketplace</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"ServiceGo" <${process.env.EMAIL_USER}>`,
      to: providerEmail,
      subject: `🎉 Your service "${service.name}" is now LIVE on ServiceGo!`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('Service approval email sent to provider');
  } catch (error) {
    console.error('Failed to send service approval email:', error.message);
  }
};
/**
 * Send email to admin(s) when a new service is created and needs approval
 */
const sendNewServiceToAdminEmail = async ({ adminEmails, providerName, service }) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🔔 ServiceGo Admin</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">New Service Awaiting Approval</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <h2 style="color: #1e293b; margin: 0 0 16px;">A new service needs your review! ⏳</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
            <strong>${providerName}</strong> has submitted a new service for approval. 
            Please review and approve/reject it from the Admin Dashboard.
          </p>
          
          <div style="background: #fffbeb; border: 2px solid #fde68a; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: left;">
            <p style="color: #92400e; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Pending Service Details</p>
            <p style="color: #78350f; font-size: 22px; font-weight: 900; margin: 0;">${service.name}</p>
            <p style="color: #a16207; font-size: 14px; margin: 8px 0 0; text-transform: capitalize;">📂 ${service.category}</p>
            <p style="color: #a16207; font-size: 14px; margin: 4px 0 0;">💰 ₹${service.price} • ⏱ ${service.duration} min</p>
            ${service.description ? `<p style="color: #a16207; font-size: 13px; margin: 8px 0 0;">📝 ${service.description}</p>` : ''}
            <p style="color: #92400e; font-size: 13px; margin: 12px 0 0; font-weight: 600;">👤 Provider: ${providerName}</p>
          </div>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin" 
             style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 16px;">
            Review in Admin Dashboard →
          </a>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ServiceGo — Admin Notification</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"ServiceGo Admin" <${process.env.EMAIL_USER}>`,
      to: adminEmails.join(', '),
      subject: `🔔 New Service Pending Approval: "${service.name}" by ${providerName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('New service notification sent to admin(s)');
  } catch (error) {
    console.error('Failed to send admin notification:', error.message);
  }
};

module.exports = { sendBookingNotification, sendBookingConfirmation, sendOTPEmail, getWhatsAppOTPLink, sendServiceApprovalEmail, sendNewServiceToAdminEmail };

