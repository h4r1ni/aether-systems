"use client";

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-secondary-100">
      <div className="container mx-auto py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-8 w-8 overflow-hidden rounded bg-primary-600">
              <div className="absolute inset-0 bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
            </div>
            <span className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200">
              Aether Systems
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { href: "/#services", label: "Services" },
              { href: "/#industries", label: "Industries" },
              { href: "/case-studies", label: "Case Studies" },
              { href: "/pricing", label: "Pricing" },
              { href: "/about", label: "About" }
            ].map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className="px-3 py-2 text-secondary-700 hover:text-primary-600 font-medium text-sm rounded-md hover:bg-secondary-50 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link 
              href="/contact" 
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors duration-200 text-sm shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50 rounded-md transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-secondary-100">
            <ul className="flex flex-col space-y-2 pb-2">
              {[
                { href: "/#services", label: "Services" },
                { href: "/#industries", label: "Industries" },
                { href: "/case-studies", label: "Case Studies" },
                { href: "/pricing", label: "Pricing" },
                { href: "/about", label: "About" }
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block px-2 py-2 text-secondary-700 hover:text-primary-600 hover:bg-secondary-50 font-medium text-sm rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  href="/contact"
                  className="block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-md transition-colors text-center shadow-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
