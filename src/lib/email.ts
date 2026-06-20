import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

const FROM = `Seysey Studios <${process.env.GMAIL_USER}>`

export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  total: string,
  dueDate: string,
  pdfBuffer?: Buffer,
  senderEmail?: string,
  portalUrl?: string,
  clientName?: string,
) {
  const attachments = pdfBuffer
    ? [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }]
    : []

  const greeting = clientName ? `Hi ${clientName.split(' ')[0]},` : 'Hello,'
  const portalBlock = portalUrl ? `
    <div style="margin: 24px 0; padding: 16px; background: #f6f7f9; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px;">View invoice online:</p>
      <a href="${portalUrl}" style="color: #1A4332; font-weight: 600; word-break: break-all;">${portalUrl}</a>
    </div>
  ` : ''

  await getTransporter().sendMail({
    from: senderEmail ? `"${senderEmail}" <${process.env.GMAIL_USER}>` : FROM,
    replyTo: senderEmail || undefined,
    to,
    subject: `Invoice ${invoiceNumber} - Payment Due ${dueDate}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1A4332; margin: 0 0 16px 0;">Invoice ${invoiceNumber}</h2>
        <p style="color: #1f2937; margin: 0 0 8px 0;">${greeting}</p>
        <p style="color: #4b5563; margin: 0 0 16px 0;">Please find your invoice details below${pdfBuffer ? ', with a PDF copy attached' : ''}.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1f2937;">Invoice Number</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1f2937;">Total Amount</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${total}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1f2937;">Due Date</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${dueDate}</td>
          </tr>
        </table>
        ${portalBlock}
        <p style="color: #4b5563; margin: 24px 0 8px 0;">Thank you for your business!</p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">For questions, simply reply to this email.</p>
      </div>
    `,
    attachments,
  })
}

export async function sendPortalLinkEmail(
  to: string,
  clientName: string,
  portalUrl: string
) {
  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: 'Your Client Portal Access - Seysey Studios',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A4332;">Welcome to Your Client Portal</h2>
        <p>Hi ${clientName || 'there'},</p>
        <p>You can access your client portal to view your projects, invoices, and approve work items using the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #1A4332; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Your Portal</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link: <a href="${portalUrl}" style="color: #1A4332;">${portalUrl}</a></p>
        <p style="color: #6b7280; font-size: 13px;">Please keep this link private — it provides direct access to your project information.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Sent via Seysey Studios</p>
      </div>
    `,
  })
}
