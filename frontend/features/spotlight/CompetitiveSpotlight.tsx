'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_FEATURED_MARKETS } from '../../config/markets';
import { BidModal } from '../bidding/BidModal';
import type { RankingEntry } from '../../types/market';

export interface MarketRankingItem {
  id: string;
  rank: number;
  name: string;
  location: string;
  avatarBg: string;
  avatarColor: string;
  avatarText: string;
  category: string;
  currentBidRupees: number;
  clicks: number;
  isNew?: boolean;
}

const BusinessLogo: React.FC<{ item: MarketRankingItem }> = ({ item }) => {
  const { name, category, rank } = item;

  let logoContent: React.ReactNode;
  let bgGradient = 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)';
  let borderColor = 'rgba(234, 88, 12, 0.25)';

  if (category === 'Interior Designers') {
    if (rank === 1 || name.includes('ABC')) {
      bgGradient = 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)';
      borderColor = 'rgba(234, 88, 12, 0.35)';
      logoContent = (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7-7-7 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2z" />
          <path d="M9 22V12h6v10" />
          <path d="M12 2v4" />
        </svg>
      );
    } else if (rank === 2 || name.includes('Studio XYZ')) {
      bgGradient = 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)';
      borderColor = 'rgba(51, 65, 85, 0.25)';
      logoContent = (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    } else if (rank === 3 || name.includes('Design House')) {
      bgGradient = 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
      borderColor = 'rgba(180, 83, 9, 0.3)';
      logoContent = (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      );
    } else {
      bgGradient = 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)';
      borderColor = 'rgba(100, 116, 139, 0.15)';
      logoContent = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18v3m16-3v3M4 14h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z" />
          <path d="M8 5v9m8-9v9" />
        </svg>
      );
    }
  } else if (category === 'Restaurants & Dining') {
    if (rank === 1) {
      bgGradient = 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)';
      borderColor = 'rgba(234, 88, 12, 0.35)';
      logoContent = (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a1 1 0 0 1 1 1v1a9 9 0 0 1 9 9h-20a9 9 0 0 1 9-9V3a1 1 0 0 1 1-1z" />
          <path d="M2 17h20a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z" />
        </svg>
      );
    } else if (rank === 2) {
      bgGradient = 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)';
      borderColor = 'rgba(51, 65, 85, 0.25)';
      logoContent = (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    } else {
      bgGradient = 'linear-gradient(135deg, #FEF3C7 0%, #FEF9C3 100%)';
      borderColor = 'rgba(180, 83, 9, 0.25)';
      logoContent = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    }
  } else if (category === 'Digital Marketing') {
    if (rank === 1) {
      bgGradient = 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)';
      borderColor = 'rgba(234, 88, 12, 0.35)';
      logoContent = (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </svg>
      );
    } else {
      bgGradient = 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)';
      borderColor = 'rgba(51, 65, 85, 0.2)';
      logoContent = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    }
  } else if (category === 'Commercial Architects') {
    if (rank === 1) {
      bgGradient = 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)';
      borderColor = 'rgba(234, 88, 12, 0.35)';
      logoContent = (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="9" y1="22" x2="9" y2="2" />
          <line x1="15" y1="22" x2="15" y2="2" />
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      );
    } else {
      bgGradient = 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)';
      borderColor = 'rgba(51, 65, 85, 0.2)';
      logoContent = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
        </svg>
      );
    }
  } else {
    // Hospitals & Healthcare
    if (rank === 1) {
      bgGradient = 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)';
      borderColor = 'rgba(234, 88, 12, 0.35)';
      logoContent = (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="14" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
      );
    } else {
      bgGradient = 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)';
      borderColor = 'rgba(51, 65, 85, 0.2)';
      logoContent = (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    }
  }

  return (
    <div
      style={{
        width: '46px',
        height: '46px',
        aspectRatio: '1 / 1',
        borderRadius: '12px',
        background: bgGradient,
        border: `1.5px solid ${borderColor}`,
        boxShadow: rank === 1 ? '0 3px 10px rgba(234, 88, 12, 0.25)' : '0 2px 6px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={`${name} Logo (1:1)`}
      aria-label={`${name} Logo`}
    >
      {logoContent}
    </div>
  );
};

interface CategoryMarketData {
  categoryName: string;
  categoryIcon: string;
  primaryLocation: string;
  items: MarketRankingItem[];
}

const CATEGORY_MARKETS: Record<string, CategoryMarketData> = {
  'Interior Designers': {
    categoryName: 'Interior Designers',
    categoryIcon: '🛋️',
    primaryLocation: 'Jaipur, Rajasthan',
    items: [
      { id: 'int-1', rank: 1, name: 'ABC Interiors', location: 'Jaipur, Rajasthan', avatarBg: '#EA580C', avatarColor: '#ffffff', avatarText: 'A', category: 'Interior Designers', currentBidRupees: 28500, clicks: 740 },
      { id: 'int-2', rank: 2, name: 'Studio XYZ', location: 'Jaipur, Rajasthan', avatarBg: '#F97316', avatarColor: '#ffffff', avatarText: 'S', category: 'Interior Designers', currentBidRupees: 27000, clicks: 612 },
      { id: 'int-3', rank: 3, name: 'Design House', location: 'Jaipur, Rajasthan', avatarBg: '#FB923C', avatarColor: '#ffffff', avatarText: 'D', category: 'Interior Designers', currentBidRupees: 24500, clicks: 520 },
      { id: 'int-4', rank: 4, name: 'Urban Interiors', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'U', category: 'Interior Designers', currentBidRupees: 22000, clicks: 410 },
      { id: 'int-5', rank: 5, name: 'SpaceCraft Studio', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SC', category: 'Interior Designers', currentBidRupees: 19000, clicks: 340 },
      { id: 'int-6', rank: 6, name: 'Royal Decorators', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'RD', category: 'Interior Designers', currentBidRupees: 17500, clicks: 290 },
      { id: 'int-7', rank: 7, name: 'Habitat Living', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'HL', category: 'Interior Designers', currentBidRupees: 16000, clicks: 260 },
      { id: 'int-8', rank: 8, name: 'Modern Space Arch', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'MS', category: 'Interior Designers', currentBidRupees: 15200, clicks: 230 },
      { id: 'int-9', rank: 9, name: 'Elegance Modulars', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'EM', category: 'Interior Designers', currentBidRupees: 14000, clicks: 200 },
      { id: 'int-10', rank: 10, name: 'Apex Interior Hub', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AI', category: 'Interior Designers', currentBidRupees: 13500, clicks: 180 },
      { id: 'int-11', rank: 11, name: 'Zen Living Concepts', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'ZL', category: 'Interior Designers', currentBidRupees: 12800, clicks: 160 },
      { id: 'int-12', rank: 12, name: 'Elite Decor Lounge', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'ED', category: 'Interior Designers', currentBidRupees: 11900, clicks: 145 },
      { id: 'int-13', rank: 13, name: 'Aura Interiors', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AU', category: 'Interior Designers', currentBidRupees: 10500, clicks: 130 },
      { id: 'int-14', rank: 14, name: 'Horizon Architecture', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'HA', category: 'Interior Designers', currentBidRupees: 9800, clicks: 115 },
      { id: 'int-15', rank: 15, name: 'Vista Design Lab', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'VD', category: 'Interior Designers', currentBidRupees: 8900, clicks: 100 },
      { id: 'int-16', rank: 16, name: 'Creative Spaces', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CS', category: 'Interior Designers', currentBidRupees: 8200, clicks: 85 },
      { id: 'int-17', rank: 17, name: 'Blueprint Living', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'BL', category: 'Interior Designers', currentBidRupees: 7500, clicks: 70 },
      { id: 'int-18', rank: 18, name: 'Amber Decor', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AD', category: 'Interior Designers', currentBidRupees: 6800, clicks: 60 },
      { id: 'int-19', rank: 19, name: 'Inspire Modulars', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'IM', category: 'Interior Designers', currentBidRupees: 5900, clicks: 50 },
      { id: 'int-20', rank: 20, name: 'Neo Living Co', location: 'Jaipur, Rajasthan', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'NL', category: 'Interior Designers', currentBidRupees: 5200, clicks: 40 },
    ],
  },
  'Restaurants & Dining': {
    categoryName: 'Restaurants & Dining',
    categoryIcon: '🍽️',
    primaryLocation: 'Noida, Uttar Pradesh',
    items: [
      { id: 'res-1', rank: 1, name: 'The Grand Dine', location: 'Noida, Uttar Pradesh', avatarBg: '#EA580C', avatarColor: '#ffffff', avatarText: 'GD', category: 'Restaurants & Dining', currentBidRupees: 35000, clicks: 890 },
      { id: 'res-2', rank: 2, name: 'Spice Route Fine Dining', location: 'Noida, Uttar Pradesh', avatarBg: '#F97316', avatarColor: '#ffffff', avatarText: 'SR', category: 'Restaurants & Dining', currentBidRupees: 33500, clicks: 760 },
      { id: 'res-3', rank: 3, name: 'Royal Taj Bistro', location: 'Noida, Uttar Pradesh', avatarBg: '#FB923C', avatarColor: '#ffffff', avatarText: 'RT', category: 'Restaurants & Dining', currentBidRupees: 31000, clicks: 640 },
      { id: 'res-4', rank: 4, name: 'Cafe Velvet', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CV', category: 'Restaurants & Dining', currentBidRupees: 28500, clicks: 510 },
      { id: 'res-5', rank: 5, name: 'Olive Gardenia', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'OG', category: 'Restaurants & Dining', currentBidRupees: 26000, clicks: 430 },
      { id: 'res-6', rank: 6, name: 'Urban Bar & Grill', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'UB', category: 'Restaurants & Dining', currentBidRupees: 23500, clicks: 380 },
      { id: 'res-7', rank: 7, name: 'Heritage Haveli', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'HH', category: 'Restaurants & Dining', currentBidRupees: 21000, clicks: 320 },
      { id: 'res-8', rank: 8, name: 'Smoke & Sizzle', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SS', category: 'Restaurants & Dining', currentBidRupees: 19500, clicks: 270 },
      { id: 'res-9', rank: 9, name: 'Gourmet Kitchen', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'GK', category: 'Restaurants & Dining', currentBidRupees: 18000, clicks: 240 },
      { id: 'res-10', rank: 10, name: 'Bistro Nirvana', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'BN', category: 'Restaurants & Dining', currentBidRupees: 16500, clicks: 210 },
      { id: 'res-11', rank: 11, name: 'Ocean Grill', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'OG', category: 'Restaurants & Dining', currentBidRupees: 15000, clicks: 180 },
      { id: 'res-12', rank: 12, name: 'Fusion Lounge', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'FL', category: 'Restaurants & Dining', currentBidRupees: 14200, clicks: 160 },
      { id: 'res-13', rank: 13, name: 'The Rustic Table', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'RT', category: 'Restaurants & Dining', currentBidRupees: 13000, clicks: 140 },
      { id: 'res-14', rank: 14, name: 'Silver Spoon', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SS', category: 'Restaurants & Dining', currentBidRupees: 12100, clicks: 120 },
      { id: 'res-15', rank: 15, name: 'Daily Crave Cafe', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'DC', category: 'Restaurants & Dining', currentBidRupees: 11000, clicks: 105 },
      { id: 'res-16', rank: 16, name: 'Chopstick Express', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CE', category: 'Restaurants & Dining', currentBidRupees: 10200, clicks: 95 },
      { id: 'res-17', rank: 17, name: 'Green Leaf Organics', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'GL', category: 'Restaurants & Dining', currentBidRupees: 9500, clicks: 80 },
      { id: 'res-18', rank: 18, name: 'Cafe Mocha', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CM', category: 'Restaurants & Dining', currentBidRupees: 8800, clicks: 70 },
      { id: 'res-19', rank: 19, name: 'Flame & Roast', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'FR', category: 'Restaurants & Dining', currentBidRupees: 8000, clicks: 60 },
      { id: 'res-20', rank: 20, name: 'Chai & Stories', location: 'Noida, Uttar Pradesh', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CS', category: 'Restaurants & Dining', currentBidRupees: 7200, clicks: 50 },
    ],
  },
  'Digital Marketing': {
    categoryName: 'Digital Marketing',
    categoryIcon: '📈',
    primaryLocation: 'Delhi, Delhi NCR',
    items: [
      { id: 'dig-1', rank: 1, name: 'RankPulse Media', location: 'Delhi, Delhi NCR', avatarBg: '#EA580C', avatarColor: '#ffffff', avatarText: 'RP', category: 'Digital Marketing', currentBidRupees: 48000, clicks: 980 },
      { id: 'dig-2', rank: 2, name: 'AdScale Growth Lab', location: 'Delhi, Delhi NCR', avatarBg: '#F97316', avatarColor: '#ffffff', avatarText: 'AS', category: 'Digital Marketing', currentBidRupees: 45500, clicks: 820 },
      { id: 'dig-3', rank: 3, name: 'Digital Horizon', location: 'Delhi, Delhi NCR', avatarBg: '#FB923C', avatarColor: '#ffffff', avatarText: 'DH', category: 'Digital Marketing', currentBidRupees: 42000, clicks: 710 },
      { id: 'dig-4', rank: 4, name: 'ClickWave Marketing', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CW', category: 'Digital Marketing', currentBidRupees: 39000, clicks: 600 },
      { id: 'dig-5', rank: 5, name: 'BrandElevate Studio', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'BE', category: 'Digital Marketing', currentBidRupees: 36500, clicks: 520 },
      { id: 'dig-6', rank: 6, name: 'SEO Maestros', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SM', category: 'Digital Marketing', currentBidRupees: 33000, clicks: 440 },
      { id: 'dig-7', rank: 7, name: 'WebCrafters India', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'WC', category: 'Digital Marketing', currentBidRupees: 30500, clicks: 380 },
      { id: 'dig-8', rank: 8, name: 'SocialBurst Agency', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SB', category: 'Digital Marketing', currentBidRupees: 28000, clicks: 330 },
      { id: 'dig-9', rank: 9, name: 'LeadMagnet Pro', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'LM', category: 'Digital Marketing', currentBidRupees: 25500, clicks: 280 },
      { id: 'dig-10', rank: 10, name: 'GrowthTribe Media', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'GT', category: 'Digital Marketing', currentBidRupees: 23000, clicks: 240 },
      { id: 'dig-11', rank: 11, name: 'PixelPunch Agency', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'PP', category: 'Digital Marketing', currentBidRupees: 21500, clicks: 210 },
      { id: 'dig-12', rank: 12, name: 'Conversion Craft', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CC', category: 'Digital Marketing', currentBidRupees: 19800, clicks: 180 },
      { id: 'dig-13', rank: 13, name: 'ViralSpark Labs', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'VS', category: 'Digital Marketing', currentBidRupees: 18200, clicks: 160 },
      { id: 'dig-14', rank: 14, name: 'Apex Funnels', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AF', category: 'Digital Marketing', currentBidRupees: 16900, clicks: 140 },
      { id: 'dig-15', rank: 15, name: 'NextGen Digital', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'ND', category: 'Digital Marketing', currentBidRupees: 15500, clicks: 120 },
      { id: 'dig-16', rank: 16, name: 'SparkSEO Global', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SG', category: 'Digital Marketing', currentBidRupees: 14000, clicks: 100 },
      { id: 'dig-17', rank: 17, name: 'MarketForge', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'MF', category: 'Digital Marketing', currentBidRupees: 12800, clicks: 85 },
      { id: 'dig-18', rank: 18, name: 'ReachOptima', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'RO', category: 'Digital Marketing', currentBidRupees: 11500, clicks: 75 },
      { id: 'dig-19', rank: 19, name: 'MediaCraft India', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'MC', category: 'Digital Marketing', currentBidRupees: 10200, clicks: 65 },
      { id: 'dig-20', rank: 20, name: 'BrandBoost Online', location: 'Delhi, Delhi NCR', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'BB', category: 'Digital Marketing', currentBidRupees: 9000, clicks: 55 },
    ],
  },
  'Commercial Architects': {
    categoryName: 'Commercial Architects',
    categoryIcon: '📐',
    primaryLocation: 'Gurugram, Haryana',
    items: [
      { id: 'arc-1', rank: 1, name: 'ArchTech Studios', location: 'Gurugram, Haryana', avatarBg: '#EA580C', avatarColor: '#ffffff', avatarText: 'AT', category: 'Commercial Architects', currentBidRupees: 41000, clicks: 720 },
      { id: 'arc-2', rank: 2, name: 'Skyline Planners', location: 'Gurugram, Haryana', avatarBg: '#F97316', avatarColor: '#ffffff', avatarText: 'SP', category: 'Commercial Architects', currentBidRupees: 38500, clicks: 610 },
      { id: 'arc-3', rank: 3, name: 'UrbanCraft Architects', location: 'Gurugram, Haryana', avatarBg: '#FB923C', avatarColor: '#ffffff', avatarText: 'UC', category: 'Commercial Architects', currentBidRupees: 36000, clicks: 540 },
      { id: 'arc-4', rank: 4, name: 'Matrix Design Group', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'MD', category: 'Commercial Architects', currentBidRupees: 33000, clicks: 460 },
      { id: 'arc-5', rank: 5, name: 'Nexus Architecture', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'NA', category: 'Commercial Architects', currentBidRupees: 30000, clicks: 390 },
      { id: 'arc-6', rank: 6, name: 'Apex Commercial Works', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AC', category: 'Commercial Architects', currentBidRupees: 28000, clicks: 330 },
      { id: 'arc-7', rank: 7, name: 'Aura Structures', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AS', category: 'Commercial Architects', currentBidRupees: 25500, clicks: 290 },
      { id: 'arc-8', rank: 8, name: 'Parametric Studio', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'PS', category: 'Commercial Architects', currentBidRupees: 23500, clicks: 250 },
      { id: 'arc-9', rank: 9, name: 'Vanguard Architects', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'VA', category: 'Commercial Architects', currentBidRupees: 21500, clicks: 210 },
      { id: 'arc-10', rank: 10, name: 'Form & Space Labs', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'FS', category: 'Commercial Architects', currentBidRupees: 19800, clicks: 180 },
      { id: 'arc-11', rank: 11, name: 'Integra Buildings', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'IB', category: 'Commercial Architects', currentBidRupees: 18200, clicks: 160 },
      { id: 'arc-12', rank: 12, name: 'EcoStructure Co', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'ES', category: 'Commercial Architects', currentBidRupees: 17000, clicks: 140 },
      { id: 'arc-13', rank: 13, name: 'Zenith Facades', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'ZF', category: 'Commercial Architects', currentBidRupees: 15800, clicks: 120 },
      { id: 'arc-14', rank: 14, name: 'Modus Architects', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'MA', category: 'Commercial Architects', currentBidRupees: 14500, clicks: 105 },
      { id: 'arc-15', rank: 15, name: 'Grand Axis Designs', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'GA', category: 'Commercial Architects', currentBidRupees: 13200, clicks: 90 },
      { id: 'arc-16', rank: 16, name: 'Pillar & Beam', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'PB', category: 'Commercial Architects', currentBidRupees: 12000, clicks: 80 },
      { id: 'arc-17', rank: 17, name: 'Civic Spaces', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CS', category: 'Commercial Architects', currentBidRupees: 10900, clicks: 70 },
      { id: 'arc-18', rank: 18, name: 'Nova Arch Lab', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'NL', category: 'Commercial Architects', currentBidRupees: 9800, clicks: 60 },
      { id: 'arc-19', rank: 19, name: 'Elevate Designers', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'ED', category: 'Commercial Architects', currentBidRupees: 8700, clicks: 50 },
      { id: 'arc-20', rank: 20, name: 'Solid Foundation Co', location: 'Gurugram, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SF', category: 'Commercial Architects', currentBidRupees: 7600, clicks: 40 },
    ],
  },
  'Hospitals & Healthcare': {
    categoryName: 'Hospitals & Healthcare',
    categoryIcon: '🏥',
    primaryLocation: 'Hisar, Haryana',
    items: [
      { id: 'hos-1', rank: 1, name: 'Apex HealthCare', location: 'Hisar, Haryana', avatarBg: '#EA580C', avatarColor: '#ffffff', avatarText: 'AH', category: 'Hospitals & Healthcare', currentBidRupees: 22000, clicks: 540 },
      { id: 'hos-2', rank: 2, name: 'LifeLine Super Specialty', location: 'Hisar, Haryana', avatarBg: '#F97316', avatarColor: '#ffffff', avatarText: 'LL', category: 'Hospitals & Healthcare', currentBidRupees: 20500, clicks: 480 },
      { id: 'hos-3', rank: 3, name: 'City Care Hospital', location: 'Hisar, Haryana', avatarBg: '#FB923C', avatarColor: '#ffffff', avatarText: 'CC', category: 'Hospitals & Healthcare', currentBidRupees: 18500, clicks: 410 },
      { id: 'hos-4', rank: 4, name: 'MedPlus Multi-Care', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'MP', category: 'Hospitals & Healthcare', currentBidRupees: 16800, clicks: 350 },
      { id: 'hos-5', rank: 5, name: 'CareFirst Clinics', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'CF', category: 'Hospitals & Healthcare', currentBidRupees: 15200, clicks: 310 },
      { id: 'hos-6', rank: 6, name: 'Sanjivani Medical', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SM', category: 'Hospitals & Healthcare', currentBidRupees: 14000, clicks: 270 },
      { id: 'hos-7', rank: 7, name: 'Sunrise Trauma Center', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'ST', category: 'Hospitals & Healthcare', currentBidRupees: 12900, clicks: 240 },
      { id: 'hos-8', rank: 8, name: 'Healing Hands Hospital', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'HH', category: 'Hospitals & Healthcare', currentBidRupees: 11800, clicks: 210 },
      { id: 'hos-9', rank: 9, name: 'Metro Health Hub', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'MH', category: 'Hospitals & Healthcare', currentBidRupees: 10700, clicks: 180 },
      { id: 'hos-10', rank: 10, name: 'Aura Medicare', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AM', category: 'Hospitals & Healthcare', currentBidRupees: 9800, clicks: 160 },
      { id: 'hos-11', rank: 11, name: 'Swasthya Clinic', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SC', category: 'Hospitals & Healthcare', currentBidRupees: 8900, clicks: 140 },
      { id: 'hos-12', rank: 12, name: 'Noble Care Trust', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'NC', category: 'Hospitals & Healthcare', currentBidRupees: 8100, clicks: 120 },
      { id: 'hos-13', rank: 13, name: 'Prime Diagnostic Center', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'PD', category: 'Hospitals & Healthcare', currentBidRupees: 7400, clicks: 105 },
      { id: 'hos-14', rank: 14, name: 'Pulse Heart Center', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'PH', category: 'Hospitals & Healthcare', currentBidRupees: 6800, clicks: 90 },
      { id: 'hos-15', rank: 15, name: 'Green Cross Hospital', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'GC', category: 'Hospitals & Healthcare', currentBidRupees: 6200, clicks: 80 },
      { id: 'hos-16', rank: 16, name: 'Nidaan Medicare', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'NM', category: 'Hospitals & Healthcare', currentBidRupees: 5600, clicks: 70 },
      { id: 'hos-17', rank: 17, name: 'Aarogyam Clinic', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AC', category: 'Hospitals & Healthcare', currentBidRupees: 5100, clicks: 60 },
      { id: 'hos-18', rank: 18, name: 'Ayush Superspeciality', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'AS', category: 'Hospitals & Healthcare', currentBidRupees: 4600, clicks: 50 },
      { id: 'hos-19', rank: 19, name: 'Saraswati Hospital', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'SH', category: 'Hospitals & Healthcare', currentBidRupees: 4200, clicks: 45 },
      { id: 'hos-20', rank: 20, name: 'Divine Child Care', location: 'Hisar, Haryana', avatarBg: '#F1F5F9', avatarColor: '#475569', avatarText: 'DC', category: 'Hospitals & Healthcare', currentBidRupees: 3800, clicks: 40 },
    ],
  },
};

export const CompetitiveSpotlight: React.FC = () => {
  const [categoriesData, setCategoriesData] = useState<Record<string, CategoryMarketData>>(CATEGORY_MARKETS);
  const [activeCategory, setActiveCategory] = useState<string>('Interior Designers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState<number>(8); // Initial view: 8 items
  const [latestBidAlert, setLatestBidAlert] = useState<string | null>(null);
  const [isToggleHovered, setIsToggleHovered] = useState<boolean>(false);

  // Bid Modal State
  const [isBidModalOpen, setIsBidModalOpen] = useState<boolean>(false);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>('Your Business');

  const selectedMarket = INITIAL_FEATURED_MARKETS[0];
  const activeMarketData = categoriesData[activeCategory] || categoriesData['Interior Designers'];
  const allCurrentRankings = activeMarketData.items;

  // Filter items in the current active category
  const filteredRankings = useMemo(() => {
    if (!searchQuery.trim()) return allCurrentRankings;
    const q = searchQuery.toLowerCase().trim();
    return allCurrentRankings.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
    );
  }, [allCurrentRankings, searchQuery]);

  // Sliced items according to show more / less
  const visibleRankings = useMemo(() => {
    return filteredRankings.slice(0, displayLimit);
  }, [filteredRankings, displayLimit]);

  // Simulation: When user manually triggers a live position update
  const triggerSimulatedBid = () => {
    const availableCategories = Object.keys(categoriesData);
    const otherCategories = availableCategories.filter((c) => c !== activeCategory);
    const targetCat =
      otherCategories.length > 0 && Math.random() > 0.3
        ? otherCategories[Math.floor(Math.random() * otherCategories.length)]
        : activeCategory;

    const targetCatData = categoriesData[targetCat];
    const currentLeader = targetCatData.items[0];
    const increment = Math.floor(Math.random() * 80) + 50;
    const newHighestBid = currentLeader.currentBidRupees + increment;

    // Pick a challenger from position 4-8 in the target vertical to qualify higher and claim #1
    // This guarantees business names remain realistic and 100% unique without duplicates!
    setCategoriesData((prev) => {
      const existingItems = [...prev[targetCat].items];
      // Pick an existing lower-ranked contender (rank 4, 5, or 6)
      const contenderIndex = Math.min(Math.floor(Math.random() * 3) + 3, existingItems.length - 1);
      const contender = existingItems[contenderIndex];

      // Remove the contender from current position and move to rank 1 with new highest amount
      const updatedContender: MarketRankingItem = {
        ...contender,
        currentBidRupees: newHighestBid,
        clicks: contender.clicks + Math.floor(Math.random() * 15) + 5,
        isNew: true,
      };

      const withoutContender = existingItems.filter((_, idx) => idx !== contenderIndex);
      const reorderedItems = [updatedContender, ...withoutContender].map((item, idx) => ({
        ...item,
        rank: idx + 1,
        isNew: idx === 0,
      }));

      return {
        ...prev,
        [targetCat]: {
          ...prev[targetCat],
          items: reorderedItems,
        },
      };
    });

    const contenderName = targetCatData.items[3]?.name || 'Contender';

    // CRITICAL REQUIREMENT: If a position update occurs in a different category, switch active view
    if (targetCat !== activeCategory) {
      setActiveCategory(targetCat);
      setLatestBidAlert(
        `⚡ New qualifying payment in ${targetCat}! Active view switched to ${targetCat} — ${contenderName} claimed Position #1 (₹${newHighestBid.toLocaleString()})!`
      );
    } else {
      setLatestBidAlert(
        `⚡ ${contenderName} submitted verified qualifying amount of ₹${newHighestBid.toLocaleString()} and claimed Position #1 in ${targetCat}!`
      );
    }

    setTimeout(() => {
      setLatestBidAlert(null);
    }, 5500);
  };

  const currentRankings: RankingEntry[] = useMemo(() => {
    return allCurrentRankings.map((a) => ({
      position: a.rank,
      businessId: a.id,
      businessName: a.name,
      businessSlug: a.name.toLowerCase().replace(/\s+/g, '-'),
      isVerified: true,
      visibilityAmountMinor: a.currentBidRupees * 100,
      updatedAt: new Date().toISOString(),
    }));
  }, [allCurrentRankings]);

  const handleOpenBidModal = (item: MarketRankingItem) => {
    setSelectedBusinessName(item.name);
    setIsBidModalOpen(true);
  };

  return (
    <section
      id="rankings"
      aria-label="Live Market Rankings"
      style={{
        backgroundColor: 'var(--surface-soft)', // #FFF7ED brand soft background
        padding: 'clamp(var(--space-10), 6vw, var(--space-12)) 0',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >
      <div className="container">
        {/* ==============================================================
            HEADER ROW: Eyebrow + Title + Subtitle + Search Bar on Right
           ============================================================== */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
          }}
        >
          {/* Left Title Area */}
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#EA580C',
                  display: 'block',
                }}
              >
                LIVE MARKET RANKINGS
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '1px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(234, 88, 12, 0.1)',
                  color: '#EA580C',
                  border: '1px solid rgba(234, 88, 12, 0.25)',
                }}
              >
                Interactive Example
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 36px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              Live Market Rankings
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '6px 0 0 0',
              }}
            >
              Businesses competing for paid visibility within defined Location + Category markets.
            </p>
          </div>

          {/* Right Search Input Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: '1 1 320px',
              maxWidth: '380px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#94A3B8',
                  fontSize: '14px',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business or location..."
                aria-label="Search business or location"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 38px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(11, 31, 59, 0.04)',
                  transition: 'border-color var(--motion-fast), box-shadow var(--motion-fast)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#EA580C';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(11, 31, 59, 0.04)';
                }}
              />
            </div>
          </div>
        </div>

        {/* Category Switcher Tabs (Highlights Active Market and allows manual switching) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
            Active Category:
          </span>
          {Object.keys(categoriesData).map((catName) => {
            const isSelected = catName === activeCategory;
            const catInfo = categoriesData[catName];

            return (
              <button
                key={catName}
                type="button"
                onClick={() => {
                  setActiveCategory(catName);
                  setDisplayLimit(8); // Reset limit on category switch
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: isSelected ? '1.5px solid #EA580C' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? '#EA580C' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#475569',
                  fontSize: '12px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isSelected ? '0 2px 8px rgba(234, 88, 12, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all var(--motion-fast)',
                }}
              >
                <span>{catInfo.categoryIcon}</span>
                <span>{catName}</span>
              </button>
            );
          })}
        </div>

        {/* Live Incoming Bid Notification Toast */}
        {latestBidAlert && (
          <div
            style={{
              backgroundColor: 'rgba(234, 88, 12, 0.12)',
              border: '1px solid rgba(234, 88, 12, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 18px',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              animation: 'fadeIn 0.3s ease-in-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#111827', fontWeight: 700 }}>
              <span className="live-indicator-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EA580C', display: 'inline-block' }} />
              {latestBidAlert}
            </div>
            <span style={{ fontSize: '11px', color: '#EA580C', fontWeight: 800, whiteSpace: 'nowrap' }}>LIVE SYNC ✓</span>
          </div>
        )}

        {/* ==============================================================
            THE TABLE CARD CONTAINER
           ============================================================== */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid rgba(234, 88, 12, 0.2)',
            boxShadow: '0 8px 30px rgba(11, 31, 59, 0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Card Top Banner */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em',
                    margin: 0,
                  }}
                >
                  Live market ranking · <span style={{ color: '#EA580C' }}>{activeCategory}</span>
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                Showing {visibleRankings.length} of {allCurrentRankings.length} competing businesses in {activeMarketData.primaryLocation}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Demonstrate Incoming Qualifying Payment Button */}
              <button
                type="button"
                onClick={triggerSimulatedBid}
                title="Demonstrate an incoming qualifying payment to update rankings"
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(234, 88, 12, 0.1)',
                  color: '#EA580C',
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all var(--motion-fast)',
                }}
              >
                ⚡ Demonstrate Ranking Update
              </button>

              {/* LIVE Badge */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    display: 'inline-block',
                    boxShadow: '0 0 6px #10B981',
                  }}
                />
                {allCurrentRankings.length} LIVE IN {activeCategory.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      width: '100px',
                    }}
                  >
                    RANK
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    BUSINESS
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    LOCATION
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    QUALIFYING AMOUNT
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    STATUS
                  </th>
                  <th
                    style={{
                      padding: '14px 20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#94A3B8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      textAlign: 'right',
                      width: '160px',
                    }}
                  >
                    ACTION
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleRankings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                      No matching businesses found for "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  visibleRankings.map((item) => {
                    const isHovered = hoveredRowId === item.id;
                    const isRank1 = item.rank === 1;
                    const isRank2 = item.rank === 2;
                    const isRank3 = item.rank === 3;

                    // Row Background & Border styling: Highlights 1, 2, 3 differently from other positions
                    const rowBg = item.isNew
                      ? 'rgba(234, 88, 12, 0.14)'
                      : isHovered
                      ? isRank1
                        ? 'rgba(234, 88, 12, 0.12)'
                        : isRank2
                        ? 'rgba(100, 116, 139, 0.09)'
                        : isRank3
                        ? 'rgba(217, 119, 6, 0.09)'
                        : 'rgba(255, 247, 237, 0.7)'
                      : isRank1
                      ? 'rgba(234, 88, 12, 0.06)'
                      : isRank2
                      ? 'rgba(100, 116, 139, 0.04)'
                      : isRank3
                      ? 'rgba(217, 119, 6, 0.04)'
                      : 'transparent';

                    return (
                      <tr
                        key={item.id}
                        onMouseEnter={() => setHoveredRowId(item.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          backgroundColor: rowBg,
                          transition: 'background-color 0.15s ease',
                          cursor: 'pointer',
                        }}
                      >
                        {/* 1. RANK Column — Distinctly highlights 1, 2, 3 vs 4-20 without text/emoji wrapping */}
                        <td style={{ padding: '16px 20px', verticalAlign: 'middle', width: '100px' }}>
                          {isRank1 ? (
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 900,
                                padding: '6px 14px',
                                borderRadius: 'var(--radius-pill)',
                                background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                                minWidth: '64px',
                                height: '30px',
                                boxShadow: '0 2px 10px rgba(234, 88, 12, 0.4)',
                              }}
                            >
                              👑 #1
                            </span>
                          ) : isRank2 ? (
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                padding: '6px 14px',
                                borderRadius: 'var(--radius-pill)',
                                background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                                minWidth: '64px',
                                height: '30px',
                                boxShadow: '0 2px 8px rgba(51, 65, 85, 0.25)',
                              }}
                            >
                              🥈 #2
                            </span>
                          ) : isRank3 ? (
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                padding: '6px 14px',
                                borderRadius: 'var(--radius-pill)',
                                background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                                minWidth: '64px',
                                height: '30px',
                                boxShadow: '0 2px 8px rgba(180, 83, 9, 0.25)',
                              }}
                            >
                              🥉 #3
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: '#F8FAFC',
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '42px',
                                height: '28px',
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                              }}
                            >
                              #{item.rank}
                            </span>
                          )}
                        </td>

                        {/* 2. BUSINESS Column: 1:1 Brand Logo + Business Name + Tier Badge */}
                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {/* 1:1 Aspect Ratio Brand Logo */}
                            <BusinessLogo item={item} />

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: isRank1 ? '15px' : '14px',
                                    fontWeight: isRank1 ? 900 : isRank2 || isRank3 ? 800 : 700,
                                    color: 'var(--text-primary)',
                                    lineHeight: 1.25,
                                  }}
                                >
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. LOCATION Column (Replaced Category by Location) */}
                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            📍 {item.location}
                          </span>
                        </td>

                        {/* 4. QUALIFYING AMOUNT Column — Clean amount only */}
                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              fontSize: isRank1 ? '17px' : isRank2 || isRank3 ? '15px' : '14px',
                              fontWeight: isRank1 ? 900 : isRank2 || isRank3 ? 800 : 700,
                              color: isRank1 ? '#EA580C' : isRank2 || isRank3 ? '#0F172A' : '#475569',
                              display: 'block',
                              lineHeight: 1.2,
                            }}
                          >
                            ₹{item.currentBidRupees.toLocaleString()}
                          </span>
                        </td>

                        {/* 5. STATUS Column — Verified Active Status */}
                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: isRank1 ? '#15803D' : isRank2 ? '#334155' : isRank3 ? '#B45309' : '#64748B',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: isRank1 ? '#16A34A' : isRank2 ? '#475569' : isRank3 ? '#D97706' : '#94A3B8',
                                display: 'inline-block',
                              }}
                            />
                            {isRank1 ? '#1 Active' : isRank2 ? '#2 Active' : isRank3 ? '#3 Active' : 'Qualified'}
                          </span>
                        </td>

                        {/* 6. ACTION Column (Move Up →) */}
                        <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBidModal(item);
                            }}
                            style={{
                              opacity: isHovered ? 1 : 0.88,
                              transform: isHovered ? 'scale(1)' : 'scale(0.97)',
                              transition: 'all 0.15s ease',
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: isHovered ? '#EA580C' : 'rgba(234, 88, 12, 0.1)',
                              color: isHovered ? '#ffffff' : '#EA580C',
                              border: '1px solid rgba(234, 88, 12, 0.35)',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: isHovered ? '0 3px 10px rgba(234, 88, 12, 0.3)' : 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Move Up →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Bar: Show More / Show Fewer Listings Button (20 Businesses Available) */}
          <div
            style={{
              padding: '18px 24px',
              borderTop: '1px solid #F1F5F9',
              backgroundColor: '#FAFAFA',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {displayLimit < filteredRankings.length ? (
              <button
                key="btn-show-more"
                type="button"
                onClick={() => setDisplayLimit(20)}
                onMouseEnter={() => setIsToggleHovered(true)}
                onMouseLeave={() => setIsToggleHovered(false)}
                style={{
                  padding: '11px 28px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isToggleHovered ? '#EA580C' : '#ffffff',
                  border: '2px solid #EA580C',
                  color: isToggleHovered ? '#ffffff' : '#EA580C',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isToggleHovered
                    ? '0 6px 18px rgba(234, 88, 12, 0.35)'
                    : '0 2px 8px rgba(234, 88, 12, 0.12)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Show More Listings ({filteredRankings.length - displayLimit} more)</span>
                <span>↓</span>
              </button>
            ) : (
              <button
                key="btn-show-fewer"
                type="button"
                onClick={() => setDisplayLimit(8)}
                onMouseEnter={() => setIsToggleHovered(true)}
                onMouseLeave={() => setIsToggleHovered(false)}
                style={{
                  padding: '11px 28px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isToggleHovered ? '#0B1F33' : '#ffffff',
                  border: '2px solid #0B1F33',
                  color: isToggleHovered ? '#ffffff' : '#0B1F33',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isToggleHovered
                    ? '0 6px 18px rgba(11, 31, 59, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Show Fewer Listings</span>
                <span>↑</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connected Interactive Bid Modal */}
      {isBidModalOpen && (
        <BidModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          market={selectedMarket}
          currentRankings={currentRankings}
          businessId="biz-claimant"
          businessName={selectedBusinessName}
          initialTargetPosition={1}
        />
      )}
    </section>
  );
};
