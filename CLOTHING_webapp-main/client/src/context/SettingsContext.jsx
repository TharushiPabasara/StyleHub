import React, { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    companyName: 'StyleHub',
    companyPhone: '0765564180',
    companyEmail: 'stylehubclothing2015@gmail.com',
    whatsappNumber: '0765564180',
    locationCity: 'Akuressa Town',
    locationAddress: 'Main Street, Akuressa Town, Matara, Southern Province',
    boutiqueHoursTitle: 'BOUTIQUE HOURS',
    boutiqueHoursDays: 'Daily: 9:00 AM – 8:00 PM',
    boutiqueHoursNote: 'Open all week Including Poya',
    mapQuery: 'Akuressa, Sri Lanka',
    shippingFee: 400,
    freeShippingThreshold: 15000,
    estimatedDeliveryTime: '2 to 4 Business Days',
    announcementText: 'Island-wide Delivery: LKR 400 | Complimentary Shipping on orders over LKR 15,000',
    announcements: [
      'Island-wide Delivery: LKR 400 • Complimentary Shipping on orders over LKR 15,000',
      'New Drops Every Week • Discover Our Handpicked Boutique Styles',
      'Hassle-Free 7-Day Returns & Exchanges Across Sri Lanka',
      'Cash on Delivery & Secure Online Card Payment Available'
    ],
    announcementMode: 'marquee',
    enableFreeReturns: true,
    returnPolicyDays: 14,
    returnPolicyTitle: 'Free Returns & Exchanges',
    returnPolicyDescription: 'Within 14 days of purchase for unworn items with original tags'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/contact`);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch store settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettingsState = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettingsState, fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
