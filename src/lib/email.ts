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
  pdfBuffer?: Buffer
) {
  const attachments = pdfBuffer
    ? [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }]
    : []

  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: `Invoice ${invoiceNumber} - Payment Due ${dueDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A4332;">Invoice ${invoiceNumber}</h2>
        <p>Hello,</p>
        <p>Please find your invoice details below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Invoice Number</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Total Amount</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${total}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Due Date</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${dueDate}</td>
          </tr>
        </table>
        <p>Thank you for your business!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Sent via Seysey Studios</p>
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
