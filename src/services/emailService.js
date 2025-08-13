// src/services/emailService.js
import { env } from '../config/env.js';
import nodemailer from 'nodemailer';

let transporter = null;

// Configurar transporter basado en las variables de entorno
if (env.EMAIL_PROVIDER === 'smtp' && env.SMTP_HOST) {
  transporter = nodemailer.createTransporter({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export const emailService = {
  /**
   * Enviar email de confirmación de compra
   */
  async sendPurchaseConfirmation(purchase) {
    if (!transporter) {
      console.log('📧 Email not configured, skipping purchase confirmation');
      return;
    }

    const emailTemplate = `
      <h1>¡Compra confirmada!</h1>
      <p>Hola,</p>
      <p>Tu compra del curso "<strong>${purchase.courseTitle}</strong>" ha sido confirmada.</p>
      <p><strong>Detalles de la compra:</strong></p>
      <ul>
        <li>Curso: ${purchase.courseTitle}</li>
        <li>Precio: ${(purchase.amountCents / 100).toFixed(2)} ${purchase.currency.toUpperCase()}</li>
        <li>Fecha: ${purchase.completedAt.toLocaleDateString()}</li>
        ${purchase.invoice?.number ? `<li>Factura: ${purchase.invoice.number}</li>` : ''}
      </ul>
      <p>Ya puedes acceder a tu curso desde tu dashboard.</p>
      <p>¡Que disfrutes aprendiendo!</p>
      <hr>
      <p><small>Parnassus Academy</small></p>
    `;

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM || 'noreply@parnassusacademy.com',
        to: purchase.userEmail,
        subject: `Compra confirmada: ${purchase.courseTitle}`,
        html: emailTemplate,
      });

      console.log(`📧 Purchase confirmation email sent to ${purchase.userEmail}`);
    } catch (error) {
      console.error('❌ Error sending purchase confirmation email:', error);
      throw error;
    }
  },

  /**
   * Enviar email de reembolso aprobado
   */
  async sendRefundConfirmation(purchase) {
    if (!transporter) {
      console.log('📧 Email not configured, skipping refund confirmation');
      return;
    }

    const emailTemplate = `
      <h1>Reembolso aprobado</h1>
      <p>Hola,</p>
      <p>Tu solicitud de reembolso para el curso "<strong>${purchase.courseTitle}</strong>" ha sido aprobada.</p>
      <p><strong>Detalles del reembolso:</strong></p>
      <ul>
        <li>Curso: ${purchase.courseTitle}</li>
        <li>Cantidad reembolsada: ${(purchase.refund.refundAmountCents / 100).toFixed(2)} ${purchase.currency.toUpperCase()}</li>
        <li>Fecha de reembolso: ${purchase.refund.refundedAt.toLocaleDateString()}</li>
      </ul>
      <p>El reembolso será procesado en 3-5 días hábiles.</p>
      <p>Gracias por tu comprensión.</p>
      <hr>
      <p><small>Parnassus Academy</small></p>
    `;

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM || 'noreply@parnassusacademy.com',
        to: purchase.userEmail,
        subject: `Reembolso aprobado: ${purchase.courseTitle}`,
        html: emailTemplate,
      });

      console.log(`📧 Refund confirmation email sent to ${purchase.userEmail}`);
    } catch (error) {
      console.error('❌ Error sending refund confirmation email:', error);
      throw error;
    }
  }
};
