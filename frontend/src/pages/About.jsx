import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';
import lihanImg from '../assets/lihan.png';

const TeamMember = ({ name, role, description, delay, isReversed, image }) => (
  <motion.div
    initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24 mb-40 last:mb-0`}
  >
    {/* Photo/Avatar Side */}
    <div className="w-full md:w-1/2 flex justify-center">
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-slate-800 border-4 border-white/5 flex items-center justify-center relative z-10 group-hover:border-cyan-500/30 transition-all duration-500 overflow-hidden shadow-2xl">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <FiUsers className="text-7xl text-slate-600 group-hover:text-cyan-400 transition-colors" />
          )}
        </div>
      </div>
    </div>

    {/* Description Side */}
    <div className="w-full md:w-1/2 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.2 }}
        className="flex flex-col items-center md:items-start"
      >
        <div className={`w-full flex flex-col ${isReversed ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} items-center text-center`}>
          <span className="text-cyan-400 font-bold text-sm tracking-[0.2em] uppercase mb-4 block">{role}</span>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">{name}</h3>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
            {description}
          </p>
          
          <div className="flex gap-6">
            <button className="p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all group/btn border border-white/5 shadow-lg">
              <FiGithub size={22} className="group-hover/btn:scale-110 transition-transform" />
            </button>
            <button className="p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all group/btn border border-white/5 shadow-lg">
              <FiLinkedin size={22} className="group-hover/btn:scale-110 transition-transform" />
            </button>
            <button className="p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all group/btn border border-white/5 shadow-lg">
              <FiMail size={22} className="group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const About = () => {
  return (
    <div className="about-page w-full py-32 px-4 sm:px-8 bg-[#020617] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 mb-8 rounded-full bg-cyan-500/10 border border-cyan-500/20"
          >
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em]">Our Team</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent"
          >
            The Minds Behind Money Bag
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed"
          >
            A team of passionate creators dedicated to simplifying personal finance through cutting-edge technology and beautiful design.
          </motion.p>
        </div>

        {/* Team List (Zig-Zag Layout) */}
        <div className="space-y-40">
          <TeamMember 
            name="Tahsan Ferdous Lihan" 
            role="Lead Developer" 
            description="Architect of the Money Bag ecosystem, focusing on core infrastructure and seamless user experiences. Specializes in building robust, scalable financial systems."
            delay={0.1}
            isReversed={false}
            image={lihanImg}
          />
          <TeamMember 
            name="Multazam Mahmud" 
            role="Product Strategy" 
            description="Driving the vision behind financial tools and ensuring the app meets the real-world needs of active users. Expert in crafting user-centric product roadmaps."
            delay={0.1}
            isReversed={true}
          />
          <TeamMember 
            name="Subarno Neel" 
            role="Design Lead" 
            description="The creative force behind the premium aesthetics and intuitive interface of the application. Dedicated to making complex financial data beautiful and accessible."
            delay={0.1}
            isReversed={false}
          />
        </div>


      </div>
    </div>
  );
};

export default About;
