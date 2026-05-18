import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Shield,
  Users,
  Clock,
  ArrowRight,
  Heart,
  Stethoscope,
  Calendar,
  MessageSquare,
  ChevronRight,
  Globe,
  Star,
  FileText,
  Hospital,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Hospital className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">CareFlow</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
              <a href="#solutions" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Solutions</a>
              <a href="#about" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</a>
              {!isAuthenticated && (
                <Link to="/register" className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold text-sm hover:text-blue-600 transition-colors">
                  Register
                </Link>
              )}
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
              >
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Link>
            </div>

            <div className="md:hidden">
              <Link 
                to={isAuthenticated ? "/dashboard" : "/login"} 
                className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25"
              >
                {isAuthenticated ? "Dashboard" : "Login"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-8 border border-blue-100 dark:border-blue-900/30">
              <Globe className="w-3.5 h-3.5" />
              <span>Next Generation Hospital Management</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1]">
              Elevating Healthcare through <span className="text-blue-600">Digital Intelligence</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Streamline your hospital operations, enhance patient care, and empower your medical staff with our comprehensive, AI-driven management ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to={isAuthenticated ? "/dashboard" : "/login"} 
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isAuthenticated ? "Enter Dashboard" : "Get Started Now"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                Watch Demo
              </button>
            </div>

            <div className="mt-16 flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              <div className="flex items-center gap-2 font-black text-2xl text-slate-400 italic tracking-tighter">MEDICORP</div>
              <div className="flex items-center gap-2 font-black text-2xl text-slate-400 italic tracking-tighter">HEALTHWISE</div>
              <div className="flex items-center gap-2 font-black text-2xl text-slate-400 italic tracking-tighter">GLOBECARE</div>
              <div className="flex items-center gap-2 font-black text-2xl text-slate-400 italic tracking-tighter">UNITYHEALTH</div>
              <div className="flex items-center gap-2 font-black text-2xl text-slate-400 italic tracking-tighter">PURELIFE</div>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] -z-0 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] -z-0 pointer-events-none" />
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Hospitals Managed', value: '500+', icon: Globe },
              { label: 'Daily Consultations', value: '12k+', icon: Activity },
              { label: 'Patient Satisfaction', value: '99.8%', icon: Star },
              { label: 'Active Medical Staff', value: '25k+', icon: Users },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Core Capabilities</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Everything you need to <span className="text-blue-600">modernize</span></h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart Scheduling',
                desc: 'Intelligent appointment booking with automated reminders and conflict resolution.',
                icon: Calendar,
                color: 'blue'
              },
              {
                title: 'Electronic Health Records',
                desc: 'Secure, encrypted, and instantly accessible patient history and medical reports.',
                icon: FileText,
                color: 'emerald'
              },
              {
                title: 'Digital Prescriptions',
                desc: 'Seamless medication management with automated refill requests and pharmacy integration.',
                icon: Activity,
                color: 'purple'
              },
              {
                title: 'Real-time Analytics',
                desc: 'Comprehensive dashboards providing deep insights into hospital performance and trends.',
                icon: Activity,
                color: 'blue'
              },
              {
                title: 'Secure Messaging',
                desc: 'Encrypted communication channel between patients, doctors, and administrative staff.',
                icon: MessageSquare,
                color: 'orange'
              },
              {
                title: 'Advanced Security',
                desc: 'HIPAA-compliant data protection with multi-factor authentication and audit logs.',
                icon: Shield,
                color: 'red'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4">{feature.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions / Role Section */}
      <section id="solutions" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Tailored Solutions</h2>
              <h3 className="text-4xl lg:text-6xl font-black tracking-tight mb-8">Unified experience for <span className="text-blue-500">every stakeholder</span></h3>
              <p className="text-slate-400 text-lg mb-12 font-medium">CareFlow provides specialized portals optimized for every role in your ecosystem, ensuring maximum efficiency and data integrity.</p>
              
              <div className="space-y-6">
                {[
                  { role: 'Administrators', benefit: 'Complete oversight and facility management tools' },
                  { role: 'Doctors', benefit: 'Streamlined consultation and clinical workflows' },
                  { role: 'Receptionists', benefit: 'Rapid patient intake and appointment handling' },
                  { role: 'Patients', benefit: 'Easy access to records and appointment booking' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                    <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-transform" />
                    <div>
                      <span className="font-black uppercase tracking-widest text-xs block mb-1">{item.role}</span>
                      <span className="text-slate-400 text-sm">{item.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
                <div className="aspect-square bg-gradient-to-br from-blue-600 to-indigo-800 p-8 flex items-center justify-center">
                  <Activity className="w-48 h-48 text-white opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  <div className="relative z-10 grid grid-cols-2 gap-6">
                    <div className="p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
                      <Users className="w-8 h-8 mb-4" />
                      <div className="text-2xl font-black">1.2k</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Daily Patients</div>
                    </div>
                    <div className="p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 mt-12">
                      <Heart className="w-8 h-8 mb-4 text-rose-400" />
                      <div className="text-2xl font-black">98%</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Recovery Rate</div>
                    </div>
                    <div className="p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
                      <Clock className="w-8 h-8 mb-4 text-emerald-400" />
                      <div className="text-2xl font-black">15m</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Wait Time</div>
                    </div>
                    <div className="p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 mt-12">
                      <Stethoscope className="w-8 h-8 mb-4 text-amber-400" />
                      <div className="text-2xl font-black">45</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Active Doctors</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full -z-0" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-white/5 rounded-full -z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="about" className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Success Stories</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Trusted by <span className="text-blue-600">Leading Professionals</span></h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "CareFlow has completely transformed how we manage our patient records. The interface is intuitive and the real-time analytics are game-changing.",
                author: "Dr. Sarah Chen",
                role: "Chief of Medicine, City General",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
              },
              {
                quote: "The efficiency gains in our administrative department were immediate. Appointment scheduling is now automated and error-free.",
                author: "Marcus Thompson",
                role: "Hospital Administrator",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus"
              },
              {
                quote: "Finally, a system that actually understands the clinical workflow. It saves our nurses hours of paperwork every single day.",
                author: "Elena Rodriguez",
                role: "Head Nurse, St. Jude's",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena"
              }
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
              >
                <div className="flex gap-1 text-amber-400 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full bg-slate-100" />
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{testimonial.author}</div>
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Questions & Answers</h2>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Frequently Asked</h3>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is CareFlow HIPAA compliant?",
                a: "Yes, CareFlow is fully HIPAA compliant. We use enterprise-grade encryption and strict access controls to ensure all patient data is handled with the highest security standards."
              },
              {
                q: "Can we migrate our existing data?",
                a: "Absolutely. Our specialized migration team handles the secure transfer of your existing patient records, history, and administrative data from any legacy system."
              },
              {
                q: "What kind of support do you offer?",
                a: "We provide 24/7 technical support with dedicated account managers for enterprise partners, ensuring your hospital operations never skip a beat."
              },
              {
                q: "Does it work on mobile devices?",
                a: "Yes, CareFlow is a fully responsive platform that works seamlessly on desktops, tablets, and smartphones, allowing doctors to access records on the go."
              }
            ].map((faq, i) => (
              <details key={i} className="group p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{faq.q}</h4>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-blue-600 p-12 lg:p-20 relative overflow-hidden text-center">
          <div className="relative z-10">
            <h3 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-8">Ready to transform your <br/>hospital operations?</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to={isAuthenticated ? "/dashboard" : "/login"} 
                className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all active:scale-95"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">CareFlow</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
                The future of healthcare management is here. Empowering medical institutions worldwide with cutting-edge technology and human-centric design.
              </p>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Solutions</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Demo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-slate-400">© 2026 CareFlow Systems Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px] uppercase tracking-widest">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px] uppercase tracking-widest">LinkedIn</a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px] uppercase tracking-widest">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
