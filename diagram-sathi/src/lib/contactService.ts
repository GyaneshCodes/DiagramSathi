import { supabase } from "./supabase";

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
}

export interface ContactSubmitResult {
  success: boolean;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(
  payload: ContactMessagePayload,
): Promise<ContactSubmitResult> {
  const name = payload.name.trim();
  const email = payload.email.trim();
  const message = payload.message.trim();

  // 1. Validation
  if (!name || name.length < 2) {
    return { success: false, error: "Please enter your name (at least 2 characters)." };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!message || message.length < 5) {
    return {
      success: false,
      error: "Please enter a message (at least 5 characters).",
    };
  }

  try {
    // 2. Persist to Supabase database
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert([
        {
          name,
          email,
          message,
        },
      ]);

    if (dbError) {
      console.error("Failed to save contact message to Supabase:", dbError);
      return {
        success: false,
        error: dbError.message || "Failed to submit message. Please try again.",
      };
    }

    // 3. Email Notification Forwarding
    const recipientEmail =
      import.meta.env.VITE_CONTACT_RECIPIENT_EMAIL || "gyaneshdewangan39@gmail.com";
    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    const webhookUrl = import.meta.env.VITE_CONTACT_EMAIL_WEBHOOK_URL;

    if (recipientEmail) {
      // Forward notification to admin inbox via FormSubmit.co
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: `[DiagramSathi Contact] New message from ${name}`,
          _template: "table",
          _captcha: "false",
        }),
      }).catch((err) => {
        console.warn("Email forward warning (non-fatal):", err);
      });
    } else if (accessKey) {
      // Fire and forget email notification to admin via Web3Forms
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          name,
          email,
          message,
          subject: `[DiagramSathi Contact] New message from ${name}`,
          from_name: "DiagramSathi Contact Form",
        }),
      }).catch((err) => {
        console.warn("Email forward warning (non-fatal):", err);
      });
    } else if (webhookUrl) {
      // Fire and forget custom webhook notification
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, timestamp: new Date().toISOString() }),
      }).catch((err) => {
        console.warn("Webhook forward warning (non-fatal):", err);
      });
    }

    // 4. Also keep a local backup in localStorage
    try {
      const existing = JSON.parse(
        localStorage.getItem("diagramsathi_contact_messages") || "[]",
      );
      existing.push({ name, email, message, timestamp: new Date().toISOString() });
      localStorage.setItem(
        "diagramsathi_contact_messages",
        JSON.stringify(existing.slice(-20)),
      );
    } catch {
      // Ignore local storage quota errors
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error submitting contact form:", err);
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
    return { success: false, error: errorMessage };
  }
}
