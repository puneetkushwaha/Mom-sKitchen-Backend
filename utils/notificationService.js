const nodemailer = require('nodemailer');

// Email Transporter (Update .env with real credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-password'
    }
});

/**
 * sendEmailNotification
 * @param {string} to - Customer Email
 * @param {string} subject - Email Subject
 * @param {string} text - Email Content (Fallback)
 * @param {string} html - HTML Content (For Invoices)
 */
const sendEmailNotification = async (to, subject, text, html = null) => {
    if (!to) return;
    try {
        const info = await transporter.sendMail({
            from: `"Cloud Kitchen" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text
        });
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Email Error:', error.message);
    }
};

/**
 * sendSMSNotification
 * @param {string} phone - Customer Phone
 * @param {string} message - Message body
 */
const sendSMSNotification = async (phone, message) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER; // Outgoing SMS number

    if (!sid || sid === 'your_sid_here') {
        console.log(`[SMS LOG]: to ${phone} -> ${message}`);
        return;
    }

    try {
        const client = require('twilio')(sid, token);
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

        await client.messages.create({
            body: message,
            from: from,
            to: formattedPhone
        });
        console.log(`SMS Alert sent to ${phone}`);
    } catch (error) {
        console.error('SMS Error:', error.message);
    }
};

/**
 * sendWhatsAppNotification
 * @param {string} phone - Target Phone
 * @param {string} message - Message body
 */
const sendWhatsAppNotification = async (phone, message) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!sid || sid === 'your_sid_here') {
        console.log(`[WhatsApp LOG]: to ${phone} -> ${message}`);
        return;
    }

    try {
        const client = require('twilio')(sid, token);
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

        await client.messages.create({
            from: `whatsapp:${from}`,
            body: message,
            to: `whatsapp:${formattedPhone}`
        });
        console.log(`WhatsApp Alert sent to ${phone}`);
    } catch (error) {
        console.error('WhatsApp Error:', error.message);
    }
};

/**
 * notifyAdminNewOrder
 * @param {Object} order - Order details
 * @param {string} adminPhone - Admin WhatsApp number
 */
const notifyAdminNewOrder = async (order, adminPhone) => {
    if (!adminPhone) return;

    const orderId = order.orderId || order._id.toString().slice(-6).toUpperCase();
    const message = `🔔 *New Order Received!*\nOrder ID: #${orderId}\nCustomer: ${order.user?.name || 'Guest'}\nAmount: ₹${order.payableAmount}\nPayment: ${order.paymentMode}\nItems: ${order.items.length}\nCheck dashboard for details.`;

    await sendWhatsAppNotification(adminPhone, message);
};

/**
 * notifyOrderStatus
 * @param {Object} order - Order object with user populated
 * @param {string} status - Current status
 */
const notifyOrderStatus = async (order, status) => {
    if (!order || !order.user) return;

    const { name, phone, email } = order.user;
    const orderId = order.orderId || order._id.toString().slice(-6).toUpperCase();

    let message = '';
    let subject = '';
    let html = '';

    switch (status) {
        case 'Placed':
            subject = `Order Confirmed! #${orderId}`;
            message = `Hi ${name}, your order #${orderId} has been placed. Total: ₹${order.payableAmount}.`;
            html = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ef4444;">Order Confirmed!</h2>
                    <p>Hi ${name}, your order <b>#${orderId}</b> has been received. We are starting to prepare your delicious meal!</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f9f9f9;">
                            <th style="text-align: left; padding: 10px;">Items</th>
                            <th style="text-align: right; padding: 10px;">Total</th>
                        </tr>
                        <tr>
                            <td style="padding: 10px;">${order.items.length} items from Cloud Kitchen</td>
                            <td style="text-align: right; padding: 10px;">₹${order.payableAmount}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px;"><b>Payment Mode:</b> ${order.paymentMode}</p>
                    <p>Track your order here: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track/${order._id}" style="color: #ef4444;">Order Tracking</a></p>
                </div>
            `;

            // Special SMS for COD orders
            if (order.paymentMode === 'COD') {
                await sendSMSNotification(phone, `Order #${orderId} for ₹${order.payableAmount} is confirmed via Cash on Delivery. Keep cash ready!`);
            }
            break;
        case 'Packed':
            subject = `Your Order is Packed! #${orderId}`;
            message = `Hi ${name}, great news! Your order #${orderId} is packed and ready for dispatch.`;
            break;
        case 'Dispatched':
            subject = `Order Out for Delivery! #${orderId}`;
            message = `Hi ${name}, your order #${orderId} is on the way! Our delivery partner will reach you shortly.`;
            break;
        case 'Delivered':
            subject = `Delivered! Enjoy your meal 🥘`;
            message = `Hi ${name}, your order #${orderId} has been delivered. We hope you love the flavors!`;
            break;
        default:
            return;
    }

    // Trigger both
    if (email) await sendEmailNotification(email, subject, message, html);
    if (phone) await sendWhatsAppNotification(phone, message);
};

module.exports = {
    sendEmailNotification,
    sendWhatsAppNotification,
    sendSMSNotification,
    notifyAdminNewOrder,
    notifyOrderStatus
};
