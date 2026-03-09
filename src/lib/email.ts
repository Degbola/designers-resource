import nodemailer from 'nodemailer'

export function getEmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  total: string,
  dueDate: string,
  pdfBuffer?: Buffer
) {
  const transporter = getEmailTransporter()

  const attachments = pdfBuffer
    ? [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }]
    : []

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: `Invoice ${invoiceNumber} - Payment Due ${dueDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Invoice ${invoiceNumber}</h2>
        <p>Hello,</p>
        <p>Please find your invoice attached. Here are the details:</p>
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
