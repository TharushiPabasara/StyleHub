import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowRight } from 'lucide-react';
import heroBg from '../assets/images/hero-bg.jpg';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-[85vh] w-full bg-black overflow-hidden flex items-center justify-center">
      <img 
        src={heroBg} 
        alt="Spring Summer Collection" 
        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out"
      />
      <div className="relative z-10 text-center px-4 flex flex-col items-center">
        <span className="text-gray-300 text-sm tracking-[0.3em] uppercase mb-6 block animate-fade-in-up">
          Spring / Summer 2024
        </span>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-10 tracking-tight leading-tight animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          The Silence <br className="hidden md:block"/> of Form.
        </h1>
        <Button 
          type="primary" 
          size="large" 
          onClick={() => navigate('/collections')}
          className="bg-white text-black hover:bg-gray-200 border-none px-10 h-14 text-sm font-semibold tracking-widest uppercase animate-fade-in-up flex items-center gap-2 group"
          style={{ animationDelay: '300ms' }}
        >
          Explore Collection
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </section>
  );
};

export default Hero;
