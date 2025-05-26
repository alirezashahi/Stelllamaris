import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ReturnPolicy from '../policies/ReturnPolicy';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('all');

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const faqData: FAQItem[] = [
    // Ordering & Payment
    {
      id: 'payment-methods',
      category: 'ordering',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, and Google Pay. All payments are processed securely through our encrypted payment system.'
    },
    {
      id: 'order-tracking',
      category: 'ordering',
      question: 'How can I track my order?',
      answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order by logging into your account and viewing your order history. Tracking information is usually available within 24 hours of shipment.'
    },
    {
      id: 'order-changes',
      category: 'ordering',
      question: 'Can I change or cancel my order after placing it?',
      answer: 'You can modify or cancel your order within 2 hours of placing it by contacting our customer service team. After this window, we cannot guarantee changes as your order may have already entered our fulfillment process.'
    },
    {
      id: 'international-orders',
      category: 'ordering',
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most countries worldwide. International shipping costs and delivery times vary by destination. Duties and taxes may apply and are the responsibility of the customer.'
    },
    {
      id: 'return-timeframe',
      category: 'ordering',
      question: 'How long do I have to return an item?',
      answer: 'You have 30 days from delivery date for domestic orders, 45 days for defective or damaged items, and 60 days for international orders. Custom or personalized items cannot be returned unless defective.'
    },
    {
      id: 'return-shipping',
      category: 'ordering',
      question: 'Do I have to pay for return shipping?',
      answer: 'We provide free return shipping for defective items, our shipping errors, and orders over $75 within 30 days. For other returns, customers are responsible for return shipping costs which will be deducted from your refund.'
    },
    {
      id: 'return-process',
      category: 'ordering',
      question: 'How do I return an item?',
      answer: 'Contact us at returns@stellamaris.com or start a return through your account dashboard. We\'ll provide an RMA number within 24-48 hours and instructions for returning your item.'
    },

    // Products & Quality
    {
      id: 'product-materials',
      category: 'products',
      question: 'What materials are your bags made from?',
      answer: 'Our bags are crafted from premium materials including genuine leather, sustainable vegan alternatives, organic cotton, and recycled materials. Each product page includes detailed material information and care instructions.'
    },
    {
      id: 'sustainability',
      category: 'products',
      question: 'Are your products sustainable?',
      answer: 'Yes, sustainability is core to our mission. We use eco-friendly materials, work with ethical suppliers, and have implemented sustainable packaging. Each product has a sustainability score to help you make informed choices.'
    },
    {
      id: 'product-care',
      category: 'products',
      question: 'How should I care for my bag?',
      answer: 'Care instructions vary by material. Leather bags should be conditioned regularly and stored properly. Canvas bags can be spot cleaned or machine washed on gentle cycle. Detailed care instructions are included with every order.'
    },
    {
      id: 'size-guide',
      category: 'products',
      question: 'How do I know what size to choose?',
      answer: 'Each product page includes detailed measurements and a size guide. We also have customer photos showing different sizes. If you\'re unsure, our customer service team can help you choose the perfect size.'
    },
    {
      id: 'defective-items',
      category: 'products',
      question: 'What if I receive a damaged or defective item?',
      answer: 'Contact us immediately with photos/videos of the damage. We offer full refunds or free replacements for damaged items, with partial refunds available for minor cosmetic damage. You have 45 days to report defective items.'
    },
    {
      id: 'return-condition',
      category: 'products',
      question: 'What condition do items need to be in for returns?',
      answer: 'Items must be in original, unused condition with all tags attached and original packaging included. Items showing signs of wear, stains, or damage cannot be returned unless they arrived defective.'
    },

    // Account & Services
    {
      id: 'account-benefits',
      category: 'account',
      question: 'What are the benefits of creating an account?',
      answer: 'Account holders enjoy faster checkout, order tracking, wishlist functionality, exclusive offers, early access to sales, and easier returns. You can also initiate returns directly through your account dashboard.'
    },
    {
      id: 'newsletter',
      category: 'account',
      question: 'How often do you send emails?',
      answer: 'We respect your inbox! Newsletter subscribers receive 1-2 emails per week featuring new arrivals, exclusive offers, and style inspiration. You can unsubscribe at any time or adjust your preferences in your account settings.'
    },
    {
      id: 'privacy',
      category: 'account',
      question: 'How do you protect my personal information?',
      answer: 'We take privacy seriously. Your personal information is encrypted and securely stored. We never sell your data to third parties and only use it to improve your shopping experience. View our full Privacy Policy for details.'
    },
    {
      id: 'order-disputes',
      category: 'account',
      question: 'Can I open a dispute for my order?',
      answer: 'Yes, you can open a dispute through your account dashboard for delivered orders within our return window. This is useful for damaged items, wrong items sent, or quality issues. We\'ll work with you to resolve the issue quickly.'
    },

    // Customer Service
    {
      id: 'contact-hours',
      category: 'service',
      question: 'What are our customer service hours?',
      answer: 'Our customer service team is available Monday through Friday, 9 AM to 6 PM EST. You can reach us via email at support@stellamaris.com or phone at 1-800-STELLA-M. We respond to emails within 24 hours.'
    },
    {
      id: 'warranty',
      category: 'service',
      question: 'Do you offer a warranty on your products?',
      answer: 'Yes, all our products come with a 1-year warranty against manufacturing defects. This covers issues with stitching, hardware, and material defects under normal use. Damage from wear and tear or misuse is not covered.'
    },
    {
      id: 'gift-cards',
      category: 'service',
      question: 'Do you sell gift cards?',
      answer: 'Yes, we offer digital gift cards in various amounts from $25 to $500. Gift cards never expire and can be used for any purchase on our website. They make perfect gifts for the bag lover in your life!'
    },
    {
      id: 'refund-processing',
      category: 'service',
      question: 'How long do refunds take to process?',
      answer: 'Refunds are processed within 5-7 business days after we receive and inspect your return. Refunds go back to your original payment method, and bank processing may take an additional 1-3 business days.'
    },
    {
      id: 'exchanges',
      category: 'service',
      question: 'Do you offer exchanges?',
      answer: 'We don\'t offer direct exchanges currently. To get a different size or color, return your original item and place a new order. We\'ll prioritize processing your new order once we receive your return.'
    },
    {
      id: 'international-returns',
      category: 'service',
      question: 'How do international returns work?',
      answer: 'International customers have 60 days to return items but are responsible for return shipping costs and any customs fees. Please contact returns@stellamaris.com before returning international orders for assistance.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'ordering', name: 'Ordering & Payment' },
    { id: 'products', name: 'Products & Quality' },
    { id: 'account', name: 'Account & Services' },
    { id: 'service', name: 'Customer Service' }
  ];

  const filteredFAQs = activeCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our products, ordering, shipping, and more. 
            Can't find what you're looking for? Contact our support team!
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-stellamaris-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-stellamaris-50 border border-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredFAQs.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {item.question}
                    </h3>
                    {openItems.has(item.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  
                  {openItems.has(item.id) && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Return Policy Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h2>
              
              {/* Return Policy Preview */}
              <div className="mb-6">
                <ReturnPolicy compact={true} showTitle={false} />
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Need More Help?</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Email:</strong> support@stellamaris.com</p>
                  <p><strong>Phone:</strong> 1-800-STELLA-M</p>
                  <p><strong>Hours:</strong> Mon-Fri, 9 AM - 6 PM EST</p>
                </div>
                <button className="mt-4 w-full bg-stellamaris-600 text-white py-2 px-4 rounded-lg hover:bg-stellamaris-700 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full Return Policy Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <ReturnPolicy showTitle={true} />
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center bg-stellamaris-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-stellamaris-900 mb-4">Still Have Questions?</h2>
          <p className="text-stellamaris-700 mb-6 max-w-2xl mx-auto">
            Our customer service team is here to help! Reach out via email, phone, or chat 
            and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-stellamaris-600 text-white px-6 py-3 rounded-lg hover:bg-stellamaris-700 transition-colors">
              Email Support
            </button>
            <button className="bg-white text-stellamaris-600 border-2 border-stellamaris-600 px-6 py-3 rounded-lg hover:bg-stellamaris-50 transition-colors">
              Call Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage; 