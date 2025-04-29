'use client'

import { useState, FormEvent } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  
  const [formStatus, setFormStatus] = useState<{
    submitted: boolean;
    success: boolean;
    message: string;
  }>({
    submitted: false,
    success: false,
    message: '',
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    console.log('Form data:', formData);
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      console.log('Validation failed:', { name: !!formData.name, email: !!formData.email, message: !!formData.message });
      setFormStatus({
        submitted: true,
        success: false,
        message: 'Please fill out all required fields.'
      })
      return
    }
    
    try {
      console.log('Submitting form data:', JSON.stringify(formData));
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });

        setFormStatus({
          submitted: true,
          success: true,
          message: 'Thank you for your message! We will get back to you soon.',
        });
      } else {
        console.error('Response not OK:', response.status);
        let errorMessage = 'There was an error submitting your message. Please try again.';
        
        try {
          const errorData = await response.json();
          console.error('Error data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
        }
        
        setFormStatus({
          submitted: true,
          success: false,
          message: errorMessage,
        });
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      setFormStatus({
        submitted: true,
        success: false,
        message: error.message || 'There was an error submitting your message. Please try again.',
      });
    }
  }

  const subjectOptions = [
    { value: '', label: 'Select a subject' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'feedback', label: 'Website Feedback' },
    { value: 'suggestion', label: 'Suggest a City' },
    { value: 'report', label: 'Report an Issue' },
    { value: 'business', label: 'Business Inquiry' },
  ]
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formStatus.submitted && (
        <div className={`p-4 rounded-md ${formStatus.success ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
          {formStatus.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {subjectOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        ></textarea>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="privacy"
          required
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          I agree to the <a href="https://discoverboba.com/privacy-policy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a> <span className="text-red-500">*</span>
        </label>
      </div>
      
      <div>
        <button
          type="submit"
          className="w-full md:w-auto btn-primary"
        >
          Send Message
        </button>
      </div>
    </form>
  )
}
