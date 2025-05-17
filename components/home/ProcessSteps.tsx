"use client";

import { motion } from 'framer-motion';

const steps = [
  {
    number: '1',
    title: 'Choose your plan and describe your workflow challenges',
    description: "Select a plan that matches your needs and share your business workflow challenges. We'll help you identify opportunities for automation and improvement.",
  },
  {
    number: '2',
    title: 'We design, build, and test your tailored system',
    description: 'Our team creates a custom solution built around your unique processes, integrating with your existing tools and providing a seamless experience.',
  },
  {
    number: '3',
    title: 'Launch with ongoing support and optimization',
    description: 'Go live with your new system, complete with training and dedicated support. We continuously optimize your solution as your business evolves.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
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

const ProcessSteps = () => {
  return (
    <section className="py-20 bg-secondary-50">
      <div className="container">
        <motion.div 
          className="text-center mb-14"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-3 py-1 rounded-md bg-primary-50 text-primary-600 text-sm font-medium inline-block mb-4">
            Our Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-secondary-900">
            How We Work
          </h2>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Our streamlined process delivers custom business systems that solve your unique challenges
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-x-12 gap-y-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={itemVariants} className="relative">
              {/* Connector line between steps (for desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-primary-200 transform -translate-x-1/2" />
              )}
              
              <div className="flex flex-col">
                <div className="flex mb-5 items-center">
                  <div className="bg-white border-2 border-primary-500 text-primary-600 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold mr-4 shadow-sm">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900">
                    {step.title}
                  </h3>
                </div>
                <div className="pl-16">
                  <p className="text-secondary-600 text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSteps;
