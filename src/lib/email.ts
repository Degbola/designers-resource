import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: `Invoice ${invoiceNumber} - Payment Due ${dueDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Invoice ${invoiceNumber}</h2>
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

  if (error) {
    throw new Error(error.message)
  }
}
