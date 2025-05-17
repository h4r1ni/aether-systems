"use client";

import Link from 'next/link';
import { FaLinkedin, FaTwitter, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold">Aether Systems</span>
            </div>
            <p className="text-secondary-200 mb-6 max-w-md">
              Tailored workflows, integrations, and automation designed around your unique operations.
              We build custom business systems that scale with your growth.
            </p>
            <div className="flex space-x-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-400">
                <FaLinkedin className="h-6 w-6" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-400">
                <FaTwitter className="h-6 w-6" />
              </a>
              <a href="mailto:contact@aethersystems.com" className="text-white hover:text-primary-400">
                <FaEnvelope className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#services" className="text-secondary-300 hover:text-white">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-secondary-300 hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="text-secondary-300 hover:text-white">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-secondary-300 hover:text-white">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-secondary-300">
                contact@aethersystems.com
              </li>
              <li>
                <Link href="/contact" className="text-primary-400 hover:text-primary-300">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-12 pt-8 text-sm text-secondary-400">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Aether Systems. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
