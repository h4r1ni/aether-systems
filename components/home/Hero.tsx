"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-white text-secondary-900 py-20 md:py-28">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-center opacity-[0.02] z-0"></div>
      
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
      
      <div className="container relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-16 items-center"
        >
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1 mb-6 rounded-md bg-primary-50 text-primary-600 text-sm font-medium">
              <span className="mr-2">•</span>
              Enterprise Solutions
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-secondary-900">Business Systems</span>{' '}
              <span className="text-primary-600">Built to Scale</span>
            </h1>
            
            <p className="text-lg md:text-xl text-secondary-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Tailored workflows, integrations, and automation designed around your unique operations. We build systems that grow with your business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/#services" 
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 text-center shadow-sm"
              >
                Explore Services
              </Link>
              <Link 
                href="/contact" 
                className="px-6 py-3 bg-white border border-secondary-300 hover:border-primary-500 hover:bg-primary-50 text-secondary-800 hover:text-primary-600 font-medium rounded-lg transition-colors duration-200 text-center shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
          
          <div className="relative">
            {/* Dashboard visualization */}
            <div className="relative z-10 bg-white rounded-xl shadow-xl border border-secondary-200">
              {/* Dashboard mockup */}
              <div className="overflow-hidden rounded-xl">
                {/* Dashboard header */}
                <div className="bg-secondary-100 border-b border-secondary-200 px-4 py-3 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-secondary-300"></div>
                    <div className="w-3 h-3 rounded-full bg-secondary-300"></div>
                    <div className="w-3 h-3 rounded-full bg-secondary-300"></div>
                  </div>
                  <div className="mx-auto h-5 w-64 bg-white rounded-md"></div>
                </div>
                
                {/* Dashboard content */}
                <div className="aspect-[16/10] bg-white p-4">
                  <div className="grid grid-cols-12 gap-4 h-full">
                    {/* Sidebar */}
                    <div className="col-span-3 space-y-4">
                      <div className="bg-secondary-100 rounded-lg p-3">
                        <div className="h-4 w-3/4 bg-secondary-200 rounded mb-2"></div>
                        <div className="h-3 w-full bg-secondary-200 rounded mb-2"></div>
                        <div className="h-3 w-5/6 bg-secondary-200 rounded"></div>
                      </div>
                      <div className="bg-primary-50 rounded-lg p-3">
                        <div className="h-4 w-3/4 bg-primary-100 rounded mb-2"></div>
                        <div className="h-3 w-full bg-primary-100 rounded mb-2"></div>
                        <div className="h-3 w-5/6 bg-primary-100 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Main content */}
                    <div className="col-span-9 space-y-4">
                      <div className="bg-secondary-100 rounded-lg p-3">
                        <div className="h-5 w-1/3 bg-secondary-200 rounded mb-3"></div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-secondary-200 shadow-sm">
                            <div className="h-8 w-8 rounded-full bg-primary-100 mb-2 flex items-center justify-center">
                              <div className="h-4 w-4 bg-primary-500 rounded-sm"></div>
                            </div>
                            <div className="h-3 w-2/3 bg-secondary-200 rounded mb-1"></div>
                            <div className="h-5 w-1/2 bg-secondary-300 rounded"></div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-secondary-200 shadow-sm">
                            <div className="h-8 w-8 rounded-full bg-accent-100 mb-2 flex items-center justify-center">
                              <div className="h-4 w-4 bg-accent-500 rounded-sm"></div>
                            </div>
                            <div className="h-3 w-2/3 bg-secondary-200 rounded mb-1"></div>
                            <div className="h-5 w-1/2 bg-secondary-300 rounded"></div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-secondary-200 shadow-sm">
                            <div className="h-8 w-8 rounded-full bg-secondary-100 mb-2 flex items-center justify-center">
                              <div className="h-4 w-4 bg-secondary-500 rounded-sm"></div>
                            </div>
                            <div className="h-3 w-2/3 bg-secondary-200 rounded mb-1"></div>
                            <div className="h-5 w-1/2 bg-secondary-300 rounded"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-secondary-200 p-3 shadow-sm">
                        <div className="h-5 w-1/4 bg-secondary-200 rounded mb-3"></div>
                        <div className="h-40 bg-secondary-50 rounded-lg p-3">
                          <div className="flex items-end h-full space-x-2">
                            <div className="w-1/6 h-[30%] bg-primary-500 rounded-t"></div>
                            <div className="w-1/6 h-[75%] bg-primary-500 rounded-t"></div>
                            <div className="w-1/6 h-[45%] bg-primary-500 rounded-t"></div>
                            <div className="w-1/6 h-[60%] bg-primary-500 rounded-t"></div>
                            <div className="w-1/6 h-[85%] bg-primary-500 rounded-t"></div>
                            <div className="w-1/6 h-[50%] bg-primary-500 rounded-t"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Subtle accent elements */}
            <div className="absolute -z-10 top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary-100 opacity-70 blur-3xl"></div>
            <div className="absolute -z-10 bottom-0 left-0 transform -translate-x-1/2 w-64 h-64 rounded-full bg-accent-100 opacity-70 blur-3xl"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
