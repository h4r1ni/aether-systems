import Hero from '../components/home/Hero';
import ServicesGrid from '../components/home/ServicesGrid';
import ProcessSteps from '../components/home/ProcessSteps';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesGrid />
      <ProcessSteps />
      
      {/* Industries We Serve */}
      <section id="industries" className="section bg-secondary-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Industries We Serve</h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Our flexible solutions adapt to the unique needs of various industries
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {['Consulting', 'Healthcare', 'Education', 'E-commerce'].map((industry, index) => (
              <div key={index} className="card text-center hover:-translate-y-1">
                <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 text-2xl font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{industry}</h3>
                <p className="text-secondary-600">
                  Custom solutions tailored for {industry.toLowerCase()} businesses and organizations.
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/industries" className="btn-secondary">
              Learn More About Our Industry Solutions
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Trusted by businesses across industries to deliver custom systems that work
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                title: 'CEO, Consulting Firm',
                content: 'Aether Systems transformed our client onboarding process. What used to take days now happens automatically, saving us countless hours each month.',
              },
              {
                name: 'Michael Chen',
                title: 'Director, Healthcare Provider',
                content: 'The patient scheduling system Aether built for us has reduced no-shows by 40% and improved our staff efficiency dramatically.',
              },
              {
                name: 'Emily Rodriguez',
                title: 'Founder, E-commerce Brand',
                content: 'Our custom inventory management system integrates perfectly with our existing tools. Aether truly understood our unique needs from day one.',
              },
            ].map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                    <span className="text-primary-600 font-bold">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-secondary-500">{testimonial.title}</p>
                  </div>
                </div>
                <p className="text-secondary-600 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section bg-secondary-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Flexible Pricing Plans</h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Choose the plan that fits your business needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="card border border-secondary-200 hover:border-primary-500 hover:shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Basic</h3>
                <div className="text-3xl font-bold mb-1">£499</div>
                <p className="text-secondary-500">One-time payment</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>1 core system with integrations</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Delivered in 5 business days</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic documentation</span>
                </li>
              </ul>
              
              <Link href="/checkout?plan=basic" className="btn-primary w-full text-center">
                Buy Basic
              </Link>
            </div>
            
            {/* Professional Plan */}
            <div className="card border border-primary-500 shadow-lg relative">
              <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                Popular
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <div className="text-3xl font-bold mb-1">£999</div>
                <p className="text-secondary-500">One-time payment</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Up to 3 integrated systems</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Delivered in 7 business days</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Comprehensive documentation</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>30 days support included</span>
                </li>
              </ul>
              
              <Link href="/checkout?plan=professional" className="btn-primary w-full text-center">
                Buy Pro
              </Link>
            </div>
            
            {/* Enterprise Plan */}
            <div className="card border border-secondary-200 hover:border-primary-500 hover:shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <div className="text-3xl font-bold mb-1">Custom</div>
                <p className="text-secondary-500">Tailored solution</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom full-stack solutions</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom timeline</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dedicated project manager</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Ongoing support packages</span>
                </li>
              </ul>
              
              <Link href="/contact" className="btn-primary w-full text-center">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary-600 text-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Build Your Custom Business System?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Choose a plan that works for your business and start streamlining your operations today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="btn bg-white text-primary-600 hover:bg-primary-50 border-white">
                See Pricing Options
              </Link>
              <Link href="/contact" className="btn border border-white bg-transparent hover:bg-white/10 text-white">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
