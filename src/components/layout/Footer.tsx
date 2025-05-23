import { Link } from 'react-router-dom'
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, Heart } from 'lucide-react'

const Footer = () => {
  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: Implement newsletter signup
    console.log('Newsletter signup')
  }

  return (
    <footer className="bg-sage-900 text-white">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="stellamaris-gradient w-8 h-8 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold text-white">Stellamaris</span>
            </div>
            <p className="text-sage-200 mb-4">
              Crafting sustainable luxury bags that make a difference. Every purchase supports animal shelters and charities worldwide.
            </p>
            <div className="flex items-center space-x-2 text-sage-200">
              <Heart size={16} className="text-stellamaris-400" />
              <span className="text-sm">5% of profits donated to charity</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/bags" className="text-sage-200 hover:text-white transition-colors">
                  All Bags
                </Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="text-sage-200 hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/bestsellers" className="text-sage-200 hover:text-white transition-colors">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link to="/sale" className="text-sage-200 hover:text-white transition-colors">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-sage-200 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sage-200 hover:text-white transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="text-sage-200 hover:text-white transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link to="/care-guide" className="text-sage-200 hover:text-white transition-colors">
                  Care Instructions
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sage-200 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Connected</h3>
            <p className="text-sage-200 mb-4 text-sm">
              Join our community for exclusive offers and impact updates.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="mb-6">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-sage-800 border border-sage-700 rounded-l-md text-white placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-stellamaris-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 stellamaris-gradient text-white rounded-r-md hover:opacity-90 transition-opacity"
                >
                  <Mail size={16} />
                </button>
              </div>
            </form>

            {/* Social Media */}
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                className="text-sage-200 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-sage-200 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-sage-200 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-sage-200">
              <div className="flex items-center space-x-2">
                <Phone size={14} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={14} />
                <span>hello@stellamaris.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin size={14} className="mt-0.5" />
                <span>123 Sustainability St<br />Eco City, EC 12345</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charity Impact Banner */}
      <div className="bg-stellamaris-600 py-4">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-white font-medium">
              🌱 Together, we've donated <span className="font-bold">$25,000+</span> to animal shelters and charities this year
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-sage-950 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-sage-400 text-sm">
              © 2024 Stellamaris. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="text-sage-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sage-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/accessibility" className="text-sage-400 hover:text-white transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 