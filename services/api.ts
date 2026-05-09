import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * API Service
 * Handles custom backend calls and EmailJS notifications.
 */

const resolveApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  const host = Linking.parse(Linking.createURL('/')).hostname;
  return host ? `http://${host}:3000` : 'http://localhost:3000';
};

const API_URL = resolveApiUrl();
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const EMAILJS_SERVICE_ID = 'service_855pl3l';
const EMAILJS_APPROVED_TEMPLATE_ID = 'template_ddhdpd4';
const EMAILJS_REJECTED_TEMPLATE_ID = 'template_vlng6ju';
const EMAILJS_PUBLIC_KEY = 'rtOl8W4tvRgSvuTYa';

type RegistrationEmailParams = {
  student_name: string;
  student_email: string;
  to_email?: string;
  email?: string;
  user_email?: string;
  recipient_email?: string;
  email_to?: string;
  to?: string;
  recipient?: string;
  to_name?: string;
  name?: string;
  user_name?: string;
  department: string;
  website_link?: string;
  support_email?: string;
  rejection_reason?: string;
};

const sendEmailJsTemplate = async (templateId: string, templateParams: RegistrationEmailParams) => {
  const studentEmail = templateParams.student_email?.trim().toLowerCase();
  const studentName = templateParams.student_name?.trim();

  if (!studentEmail) {
    throw new Error('Student email is required to send EmailJS email');
  }

  const normalizedTemplateParams = {
    ...templateParams,
    student_email: studentEmail,
    to_email: templateParams.to_email || studentEmail,
    email: templateParams.email || studentEmail,
    user_email: templateParams.user_email || studentEmail,
    recipient_email: templateParams.recipient_email || studentEmail,
    email_to: templateParams.email_to || studentEmail,
    to: templateParams.to || studentEmail,
    recipient: templateParams.recipient || studentEmail,
    to_name: templateParams.to_name || studentName,
    name: templateParams.name || studentName,
    user_name: templateParams.user_name || studentName,
  };

  const response = await fetch(EMAILJS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: normalizedTemplateParams,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `${message || 'Failed to send EmailJS email'} | recipient: ${studentEmail} | template: ${templateId}`
    );
  }
};

export const apiService = {
  /**
   * Request a password reset email
   */
  forgotPassword: async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      return await response.json();
    } catch (error: any) {
      console.error('API forgotPassword error:', error.message);
      throw error;
    }
  },

  /**
   * Reset password using a token
   */
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      return await response.json();
    } catch (error: any) {
      console.error('API resetPassword error:', error.message);
      throw error;
    }
  },

  sendStudentApprovalEmail: async (params: RegistrationEmailParams) => {
    try {
      await sendEmailJsTemplate(EMAILJS_APPROVED_TEMPLATE_ID, {
        website_link: 'https://your-app-url.example.com', // TODO: replace with your real app URL
        support_email: 'admin@university.edu', // TODO: replace with your support/admin email
        ...params,
      });
    } catch (error: any) {
      console.error('API sendStudentApprovalEmail error:', error.message);
      throw error;
    }
  },

  sendStudentRejectionEmail: async (params: RegistrationEmailParams) => {
    try {
      await sendEmailJsTemplate(EMAILJS_REJECTED_TEMPLATE_ID, {
        website_link: 'https://your-app-url.example.com', // TODO: replace with your real app URL
        support_email: 'admin@university.edu', // TODO: replace with your support/admin email
        ...params,
      });
    } catch (error: any) {
      console.error('API sendStudentRejectionEmail error:', error.message);
      throw error;
    }
  },
};
