import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const contactEmail = process.env.CONTACT_EMAIL;
const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Please fill out all required fields' }, { status: 400 });
    }

    // In development, we'll just log the email and return success
    if (isDevelopment) {
      console.log('Development mode: Email would be sent with the following data:');
      console.log(`From: Acme <onboarding@resend.dev>`);
      console.log(`To: ${contactEmail || 'No contact email set'}`);
      console.log(`Subject: Contact Form Submission: ${subject}`);
      console.log(`Name: ${name}`);
      console.log(`Email: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      
      return NextResponse.json({ 
        message: 'Email logged in development mode', 
        data: { success: true, development: true } 
      }, { status: 200 });
    }

    // In production, we'll send the email using Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const emailPromise = resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: [contactEmail || ''],
        subject: `Contact Form Submission: ${subject}`,
        html: `
          <h1>Contact Form Submission</h1>
          <p>Name: ${name}</p>
          <p>Email: ${email}</p>
          <p>Subject: ${subject}</p>
          <p>Message: ${message}</p>
        `,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email sending timed out')), 10000)
      );

      const data = await Promise.race([emailPromise, timeoutPromise]);

      return NextResponse.json({ message: 'Email sent successfully', data }, { status: 200 });
    } catch (error: any) {
      console.error("Failed to send email", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      if (error.name === 'AbortError') {
        console.error("Email sending timed out");
        return NextResponse.json({ message: 'Failed to send email: Email sending timed out', error: 'Email sending timed out' }, { status: 500 });
      }
      return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Failed to process request", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ message: 'Failed to process request', error: error.message }, { status: 500 });
  }
}
