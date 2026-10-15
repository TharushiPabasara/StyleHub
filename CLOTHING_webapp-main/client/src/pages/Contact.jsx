import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { MessageSquare, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';
import { SettingsContext } from '../context/SettingsContext';
import { API_URL } from '../config/api';

const Contact = () => {
  const { settings: globalSettings } = React.useContext(SettingsContext);
  
  // Store Settings (Dynamic from Admin Settings)
  const [storeSettings, setStoreSettings] = useState({
    companyName: 'StyleHub',
    companyPhone: '0765564180',
    companyEmail: 'stylehubclothing2015@gmail.com',
    whatsappNumber: '0765564180',
    locationCity: 'Akuressa Town',
    locationAddress: 'Main Street, Akuressa Town, Matara, Southern Province',
    boutiqueHoursTitle: 'BOUTIQUE HOURS',
    boutiqueHoursDays: 'Daily: 9:00 AM – 8:00 PM',
    boutiqueHoursNote: 'Open all week Including Poya',
    mapQuery: 'Akuressa, Sri Lanka'
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/contact`);
        if (res.ok) {
          const data = await res.json();
          setStoreSettings(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Error fetching contact settings:', err);
      }
    };

    fetchContactSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.reason || !formData.message.trim()) {
      return message.warning('Please complete all required fields.');
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          issueType: formData.reason,
          message: formData.message.trim()
        })
      });

      if (response.ok) {
        message.success('Thank you. Your message has been received.');
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          reason: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      message.error('An error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format clean whatsapp number for wa.me link
  const cleanWhatsApp = (storeSettings.whatsappNumber || '0765564180')
    .replace(/\D/g, '')
    .replace(/^0/, '94');

  return (
    <>
      <AnnouncementBar />
      <Navbar />

      <div className="bg-[#fbfbfb] min-h-screen py-12 lg:py-20">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Left Side: Directory & Boutique */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Direct Inquiries Card */}
              <div className="bg-[#f7f7f8] border border-gray-100 p-6 sm:p-8">
                <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-6">
                  DIRECT INQUIRIES
                </h3>

                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-gray-400 mb-0.5">Customer Care</span>
                    <a 
                      href={`tel:${storeSettings.companyPhone}`} 
                      className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      {storeSettings.companyPhone}
                    </a>
                  </div>

                  <div>
                    <span className="block text-xs text-gray-400 mb-0.5">Electronic Mail</span>
                    <a 
                      href={`mailto:${storeSettings.companyEmail}`} 
                      className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      {storeSettings.companyEmail}
                    </a>
                  </div>
                </div>

                {/* Instant Assistance Box */}
                <div className="bg-white border border-gray-100 p-5 mt-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-900">
                    <MessageSquare size={14} className="text-gray-800" />
                    <span className="text-[11px] font-bold tracking-wider uppercase">
                      INSTANT ASSISTANCE
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    For real-time fabric consultation or bespoke appointments via WhatsApp:{' '}
                    <strong className="text-gray-800 font-medium">{storeSettings.whatsappNumber}</strong>
                  </p>

                  <a 
                    href={`https://wa.me/${cleanWhatsApp}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase py-3 px-4 flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors"
                  >
                    CHAT ON WHATSAPP <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>

              {/* Single Flagship Boutique Card: Akuressa Town */}
              <div className="bg-[#f7f7f8] border border-gray-100 p-6 sm:p-8">
                <div>
                  <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">
                    {storeSettings.companyName || globalSettings.companyName || 'StyleHub'}
                  </span>
                  <h4 className="font-serif text-3xl text-gray-900 font-normal mb-3">
                    {storeSettings.locationCity || 'Akuressa Town'}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
                    {storeSettings.locationAddress || 'Main Street, Akuressa Town, Matara, Southern Province'}
                  </p>
                </div>

                <div className="bg-white border border-gray-100 p-4 mt-6 shadow-sm">
                  <span className="block text-[9px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-1.5">
                    {storeSettings.boutiqueHoursTitle || 'BOUTIQUE HOURS'}
                  </span>
                  <span className="block text-xs font-medium text-gray-800">
                    {storeSettings.boutiqueHoursDays || 'Daily: 9:00 AM – 8:00 PM'}
                  </span>
                  {storeSettings.boutiqueHoursNote && (
                    <span className="block text-[11px] text-gray-400 mt-0.5">
                      {storeSettings.boutiqueHoursNote}
                    </span>
                  )}
                </div>
              </div>

              {/* Map Preview Card - Akuressa */}
              <div className="relative h-56 bg-neutral-100 border border-gray-100 overflow-hidden shadow-sm">
                <iframe
                  title="Akuressa Boutique Location"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(storeSettings.mapQuery || 'Akuressa, Sri Lanka')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 border border-gray-200 shadow-sm text-[10px] font-bold tracking-widest uppercase text-gray-800 pointer-events-none">
                  ATELIER CONCIERGE: {storeSettings.locationCity?.toUpperCase() || 'AKURESSA TOWN'}
                </div>
              </div>

            </div>

            {/* Right Side: Correspondence Form Card */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-12 lg:p-14 border border-gray-100 shadow-sm">
              <span className="block text-[11px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-2">
                CORRESPONDENCE
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 font-normal mb-8 tracking-tight">
                Send a Message
              </h2>

              {submitted ? (
                <div className="py-12 text-center bg-[#fbfbfb] border border-gray-100 p-8 my-4">
                  <CheckCircle2 size={44} className="mx-auto text-emerald-600 mb-4" />
                  <h3 className="font-serif text-2xl text-gray-900 mb-2">Message Dispatched</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                    Thank you for contacting {storeSettings.companyName || globalSettings.companyName || 'StyleHub'}. Our concierge team has received your inquiry and will respond within 24 operational hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:text-gray-600"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1: Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800 mb-2">
                        FULL NAME *
                      </label>
                      <input 
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Ananya Perera"
                        className="w-full bg-[#f4f5f6] border border-transparent focus:border-black focus:bg-white focus:outline-none px-4 py-3.5 text-sm text-gray-900 transition-all placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800 mb-2">
                        EMAIL ADDRESS *
                      </label>
                      <input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. ananya@domain.com"
                        className="w-full bg-[#f4f5f6] border border-transparent focus:border-black focus:bg-white focus:outline-none px-4 py-3.5 text-sm text-gray-900 transition-all placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone & Reason */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800 mb-2">
                        PHONE NUMBER (optional)
                      </label>
                      <input 
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+94 7X XXX XXXX"
                        className="w-full bg-[#f4f5f6] border border-transparent focus:border-black focus:bg-white focus:outline-none px-4 py-3.5 text-sm text-gray-900 transition-all placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800 mb-2">
                        REASON FOR CONTACT *
                      </label>
                      <select 
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        className="w-full bg-[#f4f5f6] border border-transparent focus:border-black focus:bg-white focus:outline-none px-4 py-3.5 text-sm text-gray-900 transition-all cursor-pointer"
                        required
                      >
                        <option value="">Select an inquiry nature</option>
                        <option value="Order Status & Shipping">Order Status & Shipping</option>
                        <option value="Styling & Fitting Consultation">Styling & Fitting Consultation</option>
                        <option value="Bespoke & Tailoring">Bespoke & Tailoring</option>
                        <option value="Returns & Exchanges">Returns & Exchanges</option>
                        <option value="Fabric & Material Details">Fabric & Material Details</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Message */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-800 mb-2">
                      MESSAGE *
                    </label>
                    <textarea 
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Provide details regarding your order, styling requirements, or fitting preferences..."
                      className="w-full bg-[#f4f5f6] border border-transparent focus:border-black focus:bg-white focus:outline-none px-4 py-3.5 text-sm text-gray-900 transition-all placeholder:text-gray-400 resize-none"
                      required
                    />
                  </div>

                  {/* Submit Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
                    <p className="text-xs text-gray-400 font-light">
                      We respond within 24 operational hours.
                    </p>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="bg-black text-white text-xs font-bold tracking-[0.2em] uppercase px-9 py-4 hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {submitting ? 'SENDING...' : 'SEND MESSAGE'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Contact;
