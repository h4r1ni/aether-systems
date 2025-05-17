"use client";

import { FaCalendarAlt, FaCreditCard, FaUsers, FaChartBar, FaPlug, FaRobot } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';

const services = [
  {
    id: 'scheduling',
    title: 'Scheduling & Booking Systems',
    description: 'Streamline appointment scheduling with custom calendar integrations, automated reminders, and resource allocation.',
    icon: FaCalendarAlt,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
  },
  {
    id: 'payment',
    title: 'Payment & Checkout Integration',
    description: 'Secure payment processing, subscription management, and seamless checkout experiences.',
    icon: FaCreditCard,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
  },
  {
    id: 'crm',
    title: 'CRM & Lead Management',
    description: 'Track customer interactions, manage leads, and nurture relationships with custom workflows.',
    icon: FaUsers,
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
  },
  {
    id: 'analytics',
    title: 'Reporting & Analytics Dashboards',
    description: 'Gain insights with custom dashboards and reports tailored to your business metrics and KPIs.',
    icon: FaChartBar,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
  },
  {
    id: 'api',
    title: 'API & Software Integrations',
    description: 'Connect your essential tools with custom API integrations that sync data and automate processes.',
    icon: FaPlug,
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
  },
  {
    id: 'automation',
    title: 'Custom Automation & Process Optimization',
    description: 'Eliminate manual tasks and optimize workflows with tailor-made automation solutions.',
    icon: FaRobot,
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
  },
];

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const ServicesGrid = () => {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-3 py-1 rounded-md bg-primary-50 text-primary-600 text-sm font-medium inline-block mb-4">
              Our Expertise
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-secondary-900">
              Business Systems That Drive Growth
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              We build custom solutions that solve your unique business challenges
              and scale with your growth.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden h-full flex flex-col hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="px-6 pt-6 pb-6 flex-1 flex flex-col">
                  {/* Icon with colored background */}
                  <div className={`${service.lightColor} rounded-lg w-12 h-12 flex items-center justify-center mb-5`}>
                    <service.icon className={`h-6 w-6 ${service.color} text-white p-1 rounded`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-3 text-secondary-900">
                    {service.title}
                  </h3>
                  
                  <p className="text-secondary-600 mb-5 flex-1 text-sm leading-relaxed">
                    {service.description}
                  </p>
                  
                  <Link 
                    href={`/services/${service.id}`} 
                    className="mt-auto text-primary-600 font-medium hover:text-primary-700 inline-flex items-center text-sm"
                  >
                    <span>Learn more</span>
                    <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesGrid;
