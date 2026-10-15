import React, { useState, useEffect, useContext } from 'react';
import { Form, Input, InputNumber, Button, Card, Row, Col, message, Spin, Divider, Radio, Switch } from 'antd';
import { Phone, Mail, MapPin, Clock, Save, MessageSquare, Building2, Truck, Plus, Trash2, Sparkles, ChevronLeft, ChevronRight, RotateCcw, Info } from 'lucide-react';
import { SettingsContext } from '../../context/SettingsContext';
import { API_URL } from '../../config/api';

const AdminSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const { updateSettingsState } = useContext(SettingsContext);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings/contact`);
        if (response.ok) {
          const data = await response.json();
          if (!data.announcements || data.announcements.length === 0) {
            data.announcements = [
              `Island-wide Delivery: LKR ${(data.shippingFee ?? 400).toLocaleString()} • Free Shipping on orders over LKR ${(data.freeShippingThreshold ?? 15000).toLocaleString()}`,
              'New Drops Every Week • Discover Our Handpicked Boutique Styles',
              'Hassle-Free 7-Day Returns & Exchanges Across Sri Lanka',
              'Cash on Delivery & Secure Online Card Payment Available'
            ];
          }
          if (!data.announcementMode) {
            data.announcementMode = 'marquee';
          }
          if (data.enableFreeReturns === undefined) {
            data.enableFreeReturns = true;
          }
          if (!data.returnPolicyDays) {
            data.returnPolicyDays = 14;
          }
          if (!data.returnPolicyTitle) {
            data.returnPolicyTitle = 'Free Returns & Exchanges';
          }
          if (!data.returnPolicyDescription) {
            data.returnPolicyDescription = 'Within 14 days of purchase for unworn items with original tags';
          }
          if (!data.estimatedDeliveryTime) {
            data.estimatedDeliveryTime = '2 to 4 Business Days';
          }
          form.setFieldsValue(data);
          setPreviewData(data);
        } else {
          message.error('Failed to load contact settings');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        message.error('An error occurred while fetching settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const cleanAnnouncements = (values.announcements || []).map(s => String(s).trim()).filter(Boolean);
      const payload = {
        ...values,
        announcements: cleanAnnouncements,
        announcementText: cleanAnnouncements[0] || values.announcementText || ''
      };
      const response = await fetch(`${API_URL}/api/settings/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Settings and announcements updated successfully');
        setPreviewData(data);
        updateSettingsState(data);
      } else {
        message.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      message.error('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleValuesChange = (_, allValues) => {
    setPreviewData(prev => ({ ...prev, ...allValues }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-gray-900 mb-1">Store Settings</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        className="space-y-6"
      >
        <Row gutter={[24, 24]}>
          {/* Form Column */}
          <Col xs={24} lg={15}>
            {/* Card 1: Direct Inquiries */}
            <Card
              title={
                <div className="flex items-center gap-2 py-1">
                  <Phone size={18} className="text-gray-700" />
                  <span className="font-serif text-base text-gray-900 font-semibold">Direct Communication Channels</span>
                </div>
              }
              className="border border-gray-100 shadow-sm rounded-lg mb-6"
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Company Phone Number</span>}
                    name="companyPhone"
                    rules={[{ required: true, message: 'Please enter company phone number' }]}
                    extra="Shown under Customer Care on Contact Us page"
                  >
                    <Input size="large" placeholder="0765564180" prefix={<Phone size={14} className="text-gray-400 mr-1" />} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Company Email Address</span>}
                    name="companyEmail"
                    rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
                    extra="Official client care electronic mail address"
                  >
                    <Input size="large" placeholder="stylehubclothing2015@gmail.com" prefix={<Mail size={14} className="text-gray-400 mr-1" />} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">WhatsApp Concierge Number</span>}
                name="whatsappNumber"
                rules={[{ required: true, message: 'Please enter WhatsApp number' }]}
                extra="Used for instant fabric consultation & bespoke inquiries"
              >
                <Input size="large" placeholder="0765564180" prefix={<MessageSquare size={14} className="text-gray-400 mr-1" />} />
              </Form.Item>
            </Card>

            {/* Card 2: Shop Location (Akuressa) */}
            <Card
              title={
                <div className="flex items-center gap-2 py-1">
                  <MapPin size={18} className="text-gray-700" />
                  <span className="font-serif text-base text-gray-900 font-semibold">Flagship Shop Location & Hours</span>
                </div>
              }
              className="border border-gray-100 shadow-sm rounded-lg"
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Company Name</span>}
                    name="companyName"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                    extra="Brand name displayed across the entire store & contact page"
                  >
                    <Input size="large" placeholder="StyleHub" prefix={<Building2 size={14} className="text-gray-400 mr-1" />} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Town / City</span>}
                    name="locationCity"
                    rules={[{ required: true, message: 'Please enter city or town' }]}
                  >
                    <Input size="large" placeholder="Akuressa Town" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Full Physical Address</span>}
                name="locationAddress"
                rules={[{ required: true, message: 'Please enter street address' }]}
              >
                <Input.TextArea rows={2} placeholder="Main Street, Akuressa Town, Matara, Southern Province" />
              </Form.Item>

              <Divider className="my-4" />

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Boutique Operating Schedule</span>}
                    name="boutiqueHoursDays"
                    rules={[{ required: true, message: 'Please enter operating schedule' }]}
                  >
                    <Input size="large" placeholder="Daily: 9:00 AM – 8:00 PM" prefix={<Clock size={14} className="text-gray-400 mr-1" />} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Operating Schedule Note</span>}
                    name="boutiqueHoursNote"
                  >
                    <Input size="large" placeholder="Open all week Including Poya" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Map Search Query / Location</span>}
                name="mapQuery"
                extra="Location shown on the Google Map card on Contact Us"
              >
                <Input size="large" placeholder="Akuressa, Sri Lanka" />
              </Form.Item>
            </Card>

            {/* Card 3: Shipping & Dynamic Announcement Bar Settings */}
            <Card
              title={
                <div className="flex items-center gap-2 py-1">
                  <Truck size={18} className="text-gray-700" />
                  <span className="font-serif text-base text-gray-900 font-semibold">Shipping Rates & Dynamic Announcement Bar</span>
                </div>
              }
              className="border border-gray-100 shadow-sm rounded-lg mt-6"
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Standard Island-Wide Shipping (LKR)</span>}
                    name="shippingFee"
                    rules={[{ required: true, message: 'Please enter shipping fee' }]}
                    extra="Applied to orders below the free shipping threshold"
                  >
                    <InputNumber 
                      size="large" 
                      className="w-full" 
                      min={0} 
                      placeholder="400" 
                      prefix={<span className="text-gray-400 text-xs mr-1">LKR</span>} 
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Free Shipping Minimum Threshold (LKR)</span>}
                    name="freeShippingThreshold"
                    rules={[{ required: true, message: 'Please enter free shipping threshold' }]}
                    extra="Orders at or above this amount qualify for free delivery"
                  >
                    <InputNumber 
                      size="large" 
                      className="w-full" 
                      min={0} 
                      placeholder="15000" 
                      prefix={<span className="text-gray-400 text-xs mr-1">LKR</span>} 
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Estimated Delivery Time</span>}
                name="estimatedDeliveryTime"
                rules={[{ required: true, message: 'Please enter estimated delivery time' }]}
                extra="Displayed to customers on product pages, checkout, and shipping policy modal"
              >
                <Input 
                  size="large" 
                  placeholder="2 to 4 Business Days" 
                  prefix={<Clock size={14} className="text-gray-400 mr-1" />} 
                />
              </Form.Item>

              <Divider className="my-4" />

              {/* Announcement Bar Motion Mode */}
              <Form.Item
                label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Announcement Bar Animation Motion</span>}
                name="announcementMode"
                extra="Select how the announcement text moves across the screen for visitors"
              >
                <Radio.Group className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Radio.Button value="marquee" className="!h-auto !py-3 !px-4 text-center !rounded border">
                    <span className="font-bold block text-xs">Continuous Marquee</span>
                    <span className="text-[11px] text-gray-400 block font-normal mt-0.5">Smoothly flows across screen in continuous loop</span>
                  </Radio.Button>
                  <Radio.Button value="slider" className="!h-auto !py-3 !px-4 text-center !rounded border">
                    <span className="font-bold block text-xs">Auto-Rotating Slider</span>
                    <span className="text-[11px] text-gray-400 block font-normal mt-0.5">Rotates through messages with next/prev arrows</span>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              {/* Dynamic Announcement List */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-800 block">
                      Store Announcements ({previewData?.announcements?.length || 0})
                    </span>
                    <span className="text-[11px] text-gray-400">Add multiple announcements to display in motion</span>
                  </div>
                </div>

                <Form.List name="announcements">
                  {(fields, { add, remove }) => (
                    <div className="space-y-3">
                      {fields.map(({ key, name, ...restField }, index) => (
                        <div key={key} className="flex items-center gap-2 bg-gray-50/70 p-2 rounded border border-gray-200">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black text-white text-[11px] font-bold flex-shrink-0">
                            {index + 1}
                          </span>
                          <Form.Item
                            {...restField}
                            name={name}
                            className="!mb-0 flex-1"
                            rules={[{ required: true, message: 'Please enter announcement or remove' }]}
                          >
                            <Input 
                              size="large" 
                              placeholder={`e.g. Announcement #${index + 1}`} 
                              prefix={<Sparkles size={14} className="text-gray-400 mr-1" />}
                              className="bg-white"
                            />
                          </Form.Item>
                          {fields.length > 1 && (
                            <Button 
                              danger 
                              type="text" 
                              onClick={() => remove(name)}
                              className="text-gray-400 hover:text-red-500 p-2 flex-shrink-0"
                              title="Delete announcement"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => add('')}
                        block
                        icon={<Plus size={14} />}
                        className="mt-3 text-xs font-semibold text-gray-700 h-11 flex items-center justify-center gap-1.5 border-gray-300 hover:border-black"
                      >
                        + Add Another Announcement
                      </Button>
                    </div>
                  )}
                </Form.List>
              </div>
            </Card>

            {/* Card 4: Returns & Exchanges Policy Settings */}
            <Card
              title={
                <div className="flex items-center gap-2 py-1">
                  <RotateCcw size={18} className="text-gray-700" />
                  <span className="font-serif text-base text-gray-900 font-semibold">Free Returns & Exchanges Policy</span>
                </div>
              }
              className="border border-gray-100 shadow-sm rounded-lg mt-6"
            >
              <div className={`p-4 rounded-lg border mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${previewData?.enableFreeReturns !== false ? 'bg-emerald-50/40 border-emerald-200' : 'bg-amber-50/70 border-amber-300'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      Complimentary Customer Returns
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${previewData?.enableFreeReturns !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'}`}>
                      {previewData?.enableFreeReturns !== false ? 'ACTIVE' : 'OFF / DISABLED'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 mt-1 block">
                    {previewData?.enableFreeReturns !== false 
                      ? 'Free returns marketing, badges, and policies are shown across Home and Product Details.' 
                      : 'Customer returns are currently disabled. Return badges & policies are completely hidden from the storefront.'}
                  </span>
                </div>
                <Form.Item name="enableFreeReturns" valuePropName="checked" className="!mb-0">
                  <Switch 
                    checkedChildren="ENABLED" 
                    unCheckedChildren="OFF" 
                    className={previewData?.enableFreeReturns !== false ? "bg-black" : "bg-gray-400"}
                  />
                </Form.Item>
              </div>

              {previewData?.enableFreeReturns === false && (
                <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200/90 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                  <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block mb-0.5">Returns Policy is Currently Switched OFF</strong>
                    <span>Customers will not see return guarantees on product pages or the homepage. Turn this ON whenever you wish to offer hassle-free returns.</span>
                  </div>
                </div>
              )}

              <div className={`transition-all duration-300 ${previewData?.enableFreeReturns === false ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'}`}>
                <Row gutter={16}>
                  <Col xs={24} sm={10}>
                    <Form.Item
                      label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Return Window Duration</span>}
                      name="returnPolicyDays"
                      rules={[{ required: previewData?.enableFreeReturns !== false, message: 'Please enter return window days' }]}
                      extra="Number of days from delivery customer has to request an exchange"
                    >
                      <InputNumber 
                        size="large" 
                        className="w-full" 
                        min={1} 
                        max={90} 
                        placeholder="14" 
                        addonAfter="Days"
                        disabled={previewData?.enableFreeReturns === false}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={14}>
                    <Form.Item
                      label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Policy Headline / Title</span>}
                      name="returnPolicyTitle"
                      rules={[{ required: previewData?.enableFreeReturns !== false, message: 'Please enter policy title' }]}
                      extra="Displayed prominently in feature strips and product pages"
                    >
                      <Input 
                        size="large" 
                        placeholder="Free Returns & Exchanges" 
                        disabled={previewData?.enableFreeReturns === false}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label={<span className="text-xs font-bold uppercase tracking-wider text-gray-700">Policy Conditions & Terms Subtext</span>}
                  name="returnPolicyDescription"
                  rules={[{ required: previewData?.enableFreeReturns !== false, message: 'Please enter policy description' }]}
                  extra="Detailed guidelines shown to customers on Product Details & Home pages"
                >
                  <Input.TextArea 
                    rows={2} 
                    placeholder="Within 14 days of purchase for unworn items with original tags" 
                    disabled={previewData?.enableFreeReturns === false}
                  />
                </Form.Item>
              </div>
            </Card>

            {/* Save Button */}
            <div className="mt-8 text-right">
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<Save size={16} />}
                className="bg-black text-white hover:bg-neutral-800 h-11 px-8 text-xs font-bold tracking-widest uppercase rounded"
              >
                Save Settings
              </Button>
            </div>
          </Col>

          {/* Live Preview Column */}
          <Col xs={24} lg={9}>
            <div className="sticky top-6">
              <div className="bg-[#f7f7f8] border border-gray-200/80 p-6 rounded-lg shadow-sm">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 block mb-1">
                  LIVE PREVIEW
                </span>
                <h3 className="font-serif text-lg text-gray-900 font-medium mb-4">
                  How it appears to customers
                </h3>

                {/* Announcement Bar Live Preview */}
                <div className="bg-black text-white rounded mb-4 shadow-sm overflow-hidden border border-neutral-800">
                  <div className="px-3 py-1 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center text-[9px] font-bold tracking-widest uppercase text-gray-400">
                    <span className="text-emerald-400">ANNOUNCEMENT BAR ({previewData?.announcementMode === 'slider' ? 'SLIDER' : 'MARQUEE'})</span>
                    <span className="text-gray-500">{((previewData?.announcements || []).filter(Boolean).length) || 1} MESSAGES</span>
                  </div>

                  {previewData?.announcementMode === 'slider' ? (
                    <div className="p-3 flex items-center justify-between text-xs">
                      <button 
                        type="button"
                        onClick={() => {
                          const list = (previewData?.announcements || []).filter(Boolean);
                          if (list.length > 0) {
                            setPreviewIndex(prev => (prev - 1 + list.length) % list.length);
                          }
                        }}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <div className="flex-1 text-center px-2">
                        <span className="text-[11px] uppercase tracking-wider text-gray-200 font-medium line-clamp-1">
                          {((previewData?.announcements || []).filter(Boolean))[previewIndex % Math.max(1, ((previewData?.announcements || []).filter(Boolean)).length)] || previewData?.announcementText || 'Island-wide Delivery: LKR 400'}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const list = (previewData?.announcements || []).filter(Boolean);
                          if (list.length > 0) {
                            setPreviewIndex(prev => (prev + 1) % list.length);
                          }
                        }}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-2.5 overflow-hidden">
                      <div className="stylehub-marquee-track flex items-center">
                        {((previewData?.announcements || []).filter(Boolean).length > 0
                          ? (previewData.announcements.filter(Boolean))
                          : ['Island-wide Delivery: LKR 400 • Free over LKR 15,000', 'New Collections Drop Weekly']
                        ).map((msg, i) => (
                          <div key={i} className="flex items-center mx-4 whitespace-nowrap text-[11px] uppercase tracking-wider text-gray-200">
                            <Sparkles size={11} className="text-emerald-400 mr-1.5" />
                            <span>{msg}</span>
                            <span className="ml-4 text-emerald-400 opacity-60">✦</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Returns Policy preview */}
                <div className={`p-4 border rounded mb-4 shadow-sm transition-all ${previewData?.enableFreeReturns !== false ? 'bg-white border-gray-100' : 'bg-gray-100/70 border-dashed border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">
                      Returns & Exchanges Policy
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${previewData?.enableFreeReturns !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      {previewData?.enableFreeReturns !== false ? 'ACTIVE ON STORE' : 'HIDDEN FROM STORE'}
                    </span>
                  </div>
                  {previewData?.enableFreeReturns !== false ? (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <RotateCcw size={15} className="text-gray-800" />
                        <span className="text-xs font-bold text-gray-900">
                          {previewData?.returnPolicyTitle || 'Free Returns & Exchanges'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                        {previewData?.returnPolicyDescription || `Within ${previewData?.returnPolicyDays || 14} days of purchase for unworn items with original tags`}
                      </p>
                      <div className="bg-neutral-50 px-2.5 py-1.5 rounded text-[11px] font-medium text-neutral-700 flex items-center justify-between">
                        <span>Return Window:</span>
                        <span className="font-bold text-neutral-900">{previewData?.returnPolicyDays || 14} Days</span>
                      </div>
                    </>
                  ) : (
                    <div className="py-3 text-center">
                      <span className="text-xs text-gray-500 font-medium block">Policy is currently hidden</span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">Return guarantees & banners will not appear for customers</span>
                    </div>
                  )}
                </div>

                {/* Shipping Rule preview */}
                <div className="bg-white p-4 border border-gray-100 rounded mb-4 shadow-sm">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400 block mb-2">
                    Shipping Policy Rates
                  </span>
                  <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                    <span className="text-gray-500">Standard Delivery:</span>
                    <span className="font-bold text-gray-900">LKR {(previewData?.shippingFee ?? 400).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                    <span className="text-gray-500">Free Delivery Over:</span>
                    <span className="font-bold text-emerald-600">LKR {(previewData?.freeShippingThreshold ?? 15000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1 mt-1">
                    <span className="text-gray-500">Estimated Delivery:</span>
                    <span className="font-medium text-gray-900">{previewData?.estimatedDeliveryTime || '2 to 4 Business Days'}</span>
                  </div>
                </div>

                {/* Direct info preview */}
                <div className="bg-white p-5 border border-gray-100 rounded mb-4 shadow-sm">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400 block mb-2">
                    Direct Inquiries
                  </span>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Customer Care</span>
                      <span className="text-xs font-bold text-gray-900">{previewData?.companyPhone || '0765564180'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block">Electronic Mail</span>
                      <span className="text-xs font-bold text-gray-900">{previewData?.companyEmail || 'stylehubclothing2015@gmail.com'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">WhatsApp Assistance:</span>
                    <span className="font-bold text-black">{previewData?.whatsappNumber || '0765564180'}</span>
                  </div>
                </div>

                {/* Location preview */}
                <div className="bg-white p-5 border border-gray-100 rounded shadow-sm">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400 block mb-1">
                    {previewData?.companyName || 'StyleHub'}
                  </span>
                  <h4 className="font-serif text-xl text-gray-900 mb-2">
                    {previewData?.locationCity || 'Akuressa Town'}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    {previewData?.locationAddress || 'Main Street, Akuressa Town, Matara, Southern Province'}
                  </p>

                  <div className="bg-[#f9fafb] p-3 rounded border border-gray-100 text-xs">
                    <span className="font-bold text-gray-800 block">{previewData?.boutiqueHoursDays || 'Daily: 9:00 AM – 8:00 PM'}</span>
                    <span className="text-gray-400 text-[11px] block mt-0.5">{previewData?.boutiqueHoursNote || 'Open all week Including Poya'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AdminSettings;
