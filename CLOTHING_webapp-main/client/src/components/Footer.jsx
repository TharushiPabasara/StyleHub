import React, { useContext, useState } from 'react';
import { Layout, Row, Col, Typography, Divider, Modal } from 'antd';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import { SettingsContext } from '../context/SettingsContext';

const { Footer: AntdFooter } = Layout;
const { Paragraph } = Typography;

const Footer = () => {
  const { settings } = useContext(SettingsContext);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  return (
    <AntdFooter className="bg-black text-white py-20 px-6 lg:px-16">
      <div className="max-w-[1400px] mx-auto">
        <Row gutter={[48, 48]} className="mb-16">
          <Col xs={24} lg={8}>
            <div className="text-3xl font-serif font-semibold tracking-tighter mb-6">
              {settings?.companyName || 'StyleHub'}.
            </div>
            <Paragraph className="text-gray-400 max-w-sm mb-8">
              Redefining modern luxury through silence, form, and uncompromised quality. Based in {settings?.locationCity || 'Akuressa'}, Sri Lanka.
            </Paragraph>
            <div className="flex gap-4 text-sm font-medium tracking-widest uppercase">
              <a href="#" className="text-white hover:text-gray-400 transition-colors">Instagram</a>
              <a href="#" className="text-white hover:text-gray-400 transition-colors">Facebook</a>
              <a href="#" className="text-white hover:text-gray-400 transition-colors">Twitter</a>
            </div>
          </Col>
          
          <Col xs={12} sm={8} lg={5} lgOffset={1}>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-6 text-gray-300">Shop</h4>
            <div className="flex flex-col gap-4">
              <Link to="/collections" className="text-gray-400 hover:text-white transition-colors">New Arrivals</Link>
              <Link to="/collections/menswear" className="text-gray-400 hover:text-white transition-colors">Menswear</Link>
              <Link to="/collections/womenswear" className="text-gray-400 hover:text-white transition-colors">Womenswear</Link>
              <Link to="/collections/accessories" className="text-gray-400 hover:text-white transition-colors">Accessories</Link>
            </div>
          </Col>

          <Col xs={12} sm={8} lg={5}>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-6 text-gray-300">Support</h4>
            <div className="flex flex-col gap-4">
              <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link>
              <button 
                type="button" 
                onClick={() => setIsPolicyModalOpen(true)}
                className="text-gray-400 hover:text-white transition-colors text-left"
              >
                Shipping & Returns
              </button>
              <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Customer Care</Link>
              <Link to="/reviews" className="text-gray-400 hover:text-white transition-colors">Client Reviews</Link>
            </div>
          </Col>

          <Col xs={24} sm={8} lg={5}>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-6 text-gray-300">Legal</h4>
            <div className="flex flex-col gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </Col>
        </Row>

        <Divider className="border-gray-800" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm mt-8">
          <div>© {new Date().getFullYear()} {settings?.companyName || 'StyleHub'}. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-2">
            <span className="block w-2 h-2 rounded-full bg-green-500"></span>
            Site Operational
          </div>
        </div>
      </div>

      {/* Shipping & Returns Information Modal */}
      <Modal
        open={isPolicyModalOpen}
        onCancel={() => setIsPolicyModalOpen(false)}
        footer={null}
        width={600}
        centered
        title={
          <div className="font-serif text-xl text-gray-900">
            Delivery, Shipping & Returns Policy
          </div>
        }
      >
        <div className="py-4 space-y-6">
          {/* Shipping Policy Section */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                <Truck size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">Island-Wide Delivery Policy</h4>
                <p className="text-xs text-gray-500">Fast & reliable delivery across all 25 districts</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 text-xs text-gray-700">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Standard Delivery Rate:</span>
                <span className="font-bold">LKR {(settings?.shippingFee ?? 400).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Complimentary Free Delivery:</span>
                <span className="font-bold text-emerald-700">Orders over LKR {(settings?.freeShippingThreshold ?? 15000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Estimated Delivery Time:</span>
                <span className="font-medium">{settings?.estimatedDeliveryTime || '2 to 4 Business Days'}</span>
              </div>
            </div>
          </div>

          {/* Returns & Exchanges Section */}
          {settings?.enableFreeReturns !== false ? (
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    {settings?.returnPolicyTitle || 'Free Returns & Exchanges'}
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded">
                    {settings?.returnPolicyDays || 14}-Day Return Window
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                {settings?.returnPolicyDescription || `Items can be returned or exchanged within ${settings?.returnPolicyDays || 14} days of receipt. Garments must be unworn, undamaged, and with all original tags attached.`}
              </p>

              <div className="mt-4 pt-3 border-t border-gray-200 space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 flex-shrink-0" />
                  <span>Original brand tags and invoice intact</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 flex-shrink-0" />
                  <span>Contact customer care at {settings?.companyPhone || '0765564180'} or WhatsApp for pickup</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Returns Policy
                  </h4>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider bg-gray-200 px-2 py-0.5 rounded">
                    All Sales Final
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                Customer returns and product exchanges are currently not accepted. All orders are final sale once dispatched. For any inquiries regarding sizing or defects, please contact customer care prior to ordering.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </AntdFooter>
  );
};

export default Footer;
