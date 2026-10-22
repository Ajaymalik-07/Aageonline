'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { BusinessEntity } from '../../../types/business.ts';
import type { ClaimEvidenceType } from '../../../types/business-claim.ts';
import { validateEvidenceReference } from '../../../lib/validation/evidence.ts';

// Comprehensive Pan-India States & Major Cities Dataset
const ALL_INDIA_LOCATIONS: {
  state: string;
  stateCode: string;
  cities: string[];
}[] = [
  {
    state: 'Rajasthan',
    stateCode: 'RJ',
    cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Alwar', 'Bhilwara', 'Sikar', 'Sri Ganganagar', 'Bharatpur', 'Pali'],
  },
  {
    state: 'Maharashtra',
    stateCode: 'MH',
    cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli'],
  },
  {
    state: 'Delhi NCR',
    stateCode: 'DL',
    cities: ['New Delhi', 'South Delhi', 'North Delhi', 'West Delhi', 'East Delhi', 'Noida', 'Greater Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad'],
  },
  {
    state: 'Karnataka',
    stateCode: 'KA',
    cities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Kalaburagi', 'Shivamogga', 'Tumakuru'],
  },
  {
    state: 'Gujarat',
    stateCode: 'GJ',
    cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi'],
  },
  {
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Noida', 'Ghaziabad', 'Mathura', 'Ayodhya'],
  },
  {
    state: 'Tamil Nadu',
    stateCode: 'TN',
    cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul'],
  },
  {
    state: 'Telangana',
    stateCode: 'TG',
    cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda'],
  },
  {
    state: 'West Bengal',
    stateCode: 'WB',
    cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur', 'Bardhaman', 'Malda', 'Baharampur'],
  },
  {
    state: 'Kerala',
    stateCode: 'KL',
    cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Kottayam'],
  },
  {
    state: 'Punjab',
    stateCode: 'PB',
    cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala'],
  },
  {
    state: 'Haryana',
    stateCode: 'HR',
    cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  },
  {
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  },
  {
    state: 'Bihar',
    stateCode: 'BR',
    cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai'],
  },
  {
    state: 'Andhra Pradesh',
    stateCode: 'AP',
    cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada', 'Rajahmundry', 'Tirupati', 'Kadapa'],
  },
  {
    state: 'Odisha',
    stateCode: 'OD',
    cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak'],
  },
  {
    state: 'Assam',
    stateCode: 'AS',
    cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
  },
  {
    state: 'Jharkhand',
    stateCode: 'JH',
    cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
  },
  {
    state: 'Chhattisgarh',
    stateCode: 'CG',
    cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Durg'],
  },
  {
    state: 'Uttarakhand',
    stateCode: 'UK',
    cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Rishikesh', 'Nainital'],
  },
  {
    state: 'Himachal Pradesh',
    stateCode: 'HP',
    cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Baddi'],
  },
  {
    state: 'Goa',
    stateCode: 'GA',
    cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  },
  {
    state: 'Jammu & Kashmir',
    stateCode: 'JK',
    cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua', 'Udhampur'],
  },
  {
    state: 'Chandigarh',
    stateCode: 'CH',
    cities: ['Chandigarh', 'Mohali', 'Panchkula'],
  },
  {
    state: 'Puducherry',
    stateCode: 'PY',
    cities: ['Puducherry', 'Karaikal', 'Mahe'],
  },
  {
    state: 'Tripura',
    stateCode: 'TR',
    cities: ['Agartala', 'Dharmanagar', 'Udaipur'],
  },
  {
    state: 'Meghalaya',
    stateCode: 'ML',
    cities: ['Shillong', 'Tura', 'Jowai'],
  },
  {
    state: 'Manipur',
    stateCode: 'MN',
    cities: ['Imphal', 'Thoubal', 'Bishnupur'],
  },
  {
    state: 'Nagaland',
    stateCode: 'NL',
    cities: ['Kohima', 'Dimapur', 'Mokokchung'],
  },
  {
    state: 'Mizoram',
    stateCode: 'MZ',
    cities: ['Aizawl', 'Lunglei', 'Champhai'],
  },
  {
    state: 'Arunachal Pradesh',
    stateCode: 'AR',
    cities: ['Itanagar', 'Naharlagun', 'Pasighat'],
  },
  {
    state: 'Sikkim',
    stateCode: 'SK',
    cities: ['Gangtok', 'Namchi', 'Geyzing'],
  },
  {
    state: 'Ladakh',
    stateCode: 'LA',
    cities: ['Leh', 'Kargil'],
  },
];

// Curated Initial Categories for Typeahead Autocomplete
const POPULAR_CATEGORIES = [
  'Interior Designers',
  'Modular Kitchen Designers',
  'Architects & Architectural Consultants',
  'Civil Contractors & Builders',
  'Restaurants & Fine Dining',
  'Cafes & Bakeries',
  'Dentists & Dental Clinics',
  'Hospitals & Healthcare Centers',
  'Doctors & Specialist Clinics',
  'Digital Marketing Agencies',
  'SEO & Social Media Agencies',
  'Chartered Accountants (CA)',
  'Advocates & Legal Advisors',
  'Fitness Gyms & Health Clubs',
  'Beauty Salons & Luxury Spas',
  'Jewelers & Diamond Boutiques',
  'Real Estate Consultants & Brokers',
  'Automobile Repair & Service Centers',
  'Car Detailing & Ceramic Coating',
  'Electricians & Electrical Contractors',
  'Plumbers & Plumbing Services',
  'Event Planners & Wedding Decorators',
  'Caterers & Gourmet Catering',
  'Photography & Cinematography Studios',
  'Travel Agencies & Tour Operators',
  'Security Systems & CCTV Solutions',
  'Solar Energy Equipment Suppliers',
  'Pest Control Services',
  'Packers & Movers',
  'Coaching Institutes & Tuitions',
];

const POSITION_OPTIONS = [
  {
    position: 1,
    label: 'Position #1 (Spotlight Rank)',
    baseRupees: 28500,
    tier: 'Top 1 Rank',
    description: 'Authoritative qualifying ranking position to appear first on the website for verified customer traffic.',
  },
];

function ClaimFlowContent() {
  const searchParams = useSearchParams();
  const queryBusinessSlug = searchParams.get('business');

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; displayName?: string; phone?: string } | null>(null);
  const [ownedBusinesses, setOwnedBusinesses] = useState<{
    id: string;
    slug: string;
    name: string;
    legalName?: string;
    tagline?: string;
    description?: string;
    address?: string;
    phone?: string;
    whatsappPhone?: string;
    cityName?: string;
    categoryName?: string;
    verificationStatus: string;
    publicationStatus: string;
    evidenceType?: string;
    evidenceReference?: string;
    evidenceStatus?: string;
    role: string;
    createdAt?: string;
  }[]>([]);
  const [viewMode, setViewMode] = useState<'LOGIN' | 'YOUR_BUSINESSES' | 'REGISTER'>('LOGIN');

  // Phone + OTP Authentication States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Wizard Step: 1 = Details, 2 = Position, 3 = Payment, 4 = Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Business Profile Form Fields
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [evidenceType, setEvidenceType] = useState<ClaimEvidenceType>('GSTIN');
  const [evidenceReference, setEvidenceReference] = useState('');

  // Field validation and focus refs
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    category?: string;
    city?: string;
    evidence?: string;
  }>({});

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  // Pan-India Cascading Location
  const [selectedState, setSelectedState] = useState('Rajasthan');
  const [selectedCity, setSelectedCity] = useState('Jaipur');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityName, setCustomCityName] = useState('');

  // Smart Searchable Category Autocomplete
  const [categorySearchQuery, setCategorySearchQuery] = useState('Interior Designers');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  // Positioning & Pricing
  const [targetPosition, setTargetPosition] = useState<number>(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Current Top #1 Member in Selected Market
  const [topRankMember, setTopRankMember] = useState<{
    name: string;
    amount: number;
    isExisting: boolean;
  }>({
    name: 'ABC Interiors & Spacecraft Studio',
    amount: 28500,
    isExisting: true,
  });

  // Manual Visibility Amount (whole integers only, must be strictly greater than last price)
  const [manualAmount, setManualAmount] = useState<string>('28501');

  // Processing & Results
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    business: BusinessEntity;
    urls: {
      publicShowcase: string;
      marketLadder: string;
      workspaceProfile: string;
      directory: string;
    };
  } | null>(null);

  // Scroll to top helper to ensure next screens/steps always display from the top
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  const goToStep = (step: 1 | 2 | 3 | 4) => {
    setCurrentStep(step);
    scrollToTop();
  };

  const handleAddNewListing = () => {
    setName('');
    setLegalName('');
    setTagline('');
    setDescription('');
    setWebsite('');
    setAddress('');
    setEvidenceReference('');
    setStep1Error(null);
    setFieldErrors({});
    setViewMode('REGISTER');
    goToStep(1);
  };

  // Automatically scroll to the top whenever step advances or changes
  useEffect(() => {
    scrollToTop();
  }, [currentStep, isPhoneVerified, viewMode]);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Click outside listener for category autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically resolve the last top member of the selected category and market
  useEffect(() => {
    async function resolveCurrentTopMember() {
      const effectiveCity = isCustomCity && customCityName.trim() ? customCityName.trim() : selectedCity;
      const effectiveCategory = categorySearchQuery.trim();

      const citySlug = effectiveCity.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const catSlug = effectiveCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const canonicalKey = `${citySlug}/${catSlug}`;

      try {
        const { SUPPORTED_MARKETS } = await import('../../../data/markets/index.ts');
        if (SUPPORTED_MARKETS[canonicalKey]) {
          const topRank = SUPPORTED_MARKETS[canonicalKey].rankings.find((r) => r.rank === 1);
          if (topRank) {
            setTopRankMember({
              name: topRank.name,
              amount: topRank.qualifyingAmountRupees,
              isExisting: true,
            });
            setManualAmount((topRank.qualifyingAmountRupees + 1).toString());
            return;
          }
        }

        const { getMarketParticipationsByMarket, getBusinessById } = await import('../../../lib/taxonomy/businesses.ts');
        const marketId = `mkt-${citySlug}-${catSlug}`;
        const participations = getMarketParticipationsByMarket(marketId);
        const topPart = participations.find((p) => p.currentPosition === 1 && p.status === 'ACTIVE');
        if (topPart) {
          const biz = getBusinessById(topPart.businessId);
          const topAmount = topPart.qualifyingAmountRupees || 28500;
          setTopRankMember({
            name: biz?.name || 'Verified Commercial Entity',
            amount: topAmount,
            isExisting: true,
          });
          setManualAmount((topAmount + 1).toString());
          return;
        }

        const baseFloor = 10000;
        setTopRankMember({
          name: 'No Current Top Member (Open Category Ladder)',
          amount: baseFloor,
          isExisting: false,
        });
        setManualAmount(baseFloor.toString());
      } catch {
        const baseFloor = 10000;
        setTopRankMember({
          name: 'No Current Top Member (Open Category Ladder)',
          amount: baseFloor,
          isExisting: false,
        });
        setManualAmount(baseFloor.toString());
      }
    }

    resolveCurrentTopMember();
  }, [selectedCity, isCustomCity, customCityName, categorySearchQuery]);

  // Initial session check
  useEffect(() => {
    async function loadInitialContext() {
      try {
        if (searchParams.get('mode') === 'login' || searchParams.get('logout') === 'true') {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch {
            // safe fallback
          }
          setIsPhoneVerified(false);
          setCurrentUser(null);
          setOwnedBusinesses([]);
          setViewMode('LOGIN');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            setIsPhoneVerified(true);
            const cleanPhone = (data.user.phone || '').replace(/^\+?91/, '');
            if (cleanPhone) {
              setMobileNumber(cleanPhone);
              setPhone(cleanPhone);
              setWhatsapp(cleanPhone);
            }
            if (data.user.email && !data.user.email.includes('@owner.aageonline.in')) {
              setEmail(data.user.email);
            }
            if (data.businesses && data.businesses.length > 0) {
              setOwnedBusinesses(data.businesses);
              setViewMode('YOUR_BUSINESSES');
            } else {
              setOwnedBusinesses([]);
              setViewMode('REGISTER');
            }
          }
        }
      } catch {
        // Unauthenticated session
      } finally {
        setLoading(false);
      }
    }

    loadInitialContext();
  }, [queryBusinessSlug, searchParams]);

  const currentStateData = useMemo(() => {
    return ALL_INDIA_LOCATIONS.find((loc) => loc.state === selectedState) || ALL_INDIA_LOCATIONS[0];
  }, [selectedState]);

  const filteredCategories = useMemo(() => {
    const q = categorySearchQuery.trim().toLowerCase();
    if (!q) return POPULAR_CATEGORIES.slice(0, 8);
    return POPULAR_CATEGORIES.filter((cat) => cat.toLowerCase().includes(q));
  }, [categorySearchQuery]);

  const hasExactCategoryMatch = useMemo(() => {
    const q = categorySearchQuery.trim().toLowerCase();
    return POPULAR_CATEGORIES.some((cat) => cat.toLowerCase() === q);
  }, [categorySearchQuery]);

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setOtpSuccessMessage(null);

    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      setOtpError('Please enter a valid 10-digit Indian WhatsApp Business number (starting with 6, 7, 8, or 9).');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to send verification code.');
        return;
      }

      setIsOtpSent(true);
      setOtpSuccessMessage('Verification code sent to your registered number.');
      setOtpCountdown(60);
      setPhone(cleanNumber);
      setWhatsapp(cleanNumber);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Network error sending verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const cleanOtp = otpCode.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const cleanPhone = mobileNumber.replace(/\D/g, '');
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, code: cleanOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Invalid verification code.');
        return;
      }

      setCurrentUser(data.user);
      setIsPhoneVerified(true);
      setPhone(cleanPhone);
      setWhatsapp(cleanPhone);

      const returnUrl = searchParams.get('returnUrl');
      if (
        returnUrl &&
        returnUrl.startsWith('/') &&
        !returnUrl.startsWith('//') &&
        !returnUrl.startsWith('/auth/login') &&
        !returnUrl.startsWith('/business/claim')
      ) {
        window.location.href = returnUrl;
        return;
      }

      if (data.businesses && data.businesses.length > 0) {
        setOwnedBusinesses(data.businesses);
        setViewMode('YOUR_BUSINESSES');
      } else {
        setOwnedBusinesses([]);
        setViewMode('REGISTER');
      }
      scrollToTop();
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Network error verifying OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // safe fallback
    }
    try {
      const { setActiveDevUser } = await import('../../../lib/auth/store.ts');
      setActiveDevUser(null);
    } catch {
      // safe fallback
    }
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/business/claim');
    }
    setIsPhoneVerified(false);
    setCurrentUser(null);
    setOwnedBusinesses([]);
    setViewMode('LOGIN');
    setIsOtpSent(false);
    setOtpCode('');
    setMobileNumber('');
    setPhone('');
    setWhatsapp('');
  };

  const minRequiredRupees = topRankMember.isExisting ? topRankMember.amount + 1 : topRankMember.amount;
  const currentBidRupees = parseInt(manualAmount || '0', 10);
  const isBidTooLow = currentBidRupees < minRequiredRupees;
  const totalSettlement = currentBidRupees;

  // Step 1 Validation Handler (Accessible, near-action error summary & autofocus)
  const handleValidateStep1 = () => {
    const errors: {
      name?: string;
      phone?: string;
      category?: string;
      city?: string;
      evidence?: string;
    } = {};

    let firstSummary = '';

    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Please provide your business name (at least 2 characters).';
      if (!firstSummary) firstSummary = errors.name;
    } else {
      const duplicateOwned = ownedBusinesses.find(
        (b) => b.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicateOwned) {
        errors.name = `You already have a business registered as "${duplicateOwned.name}". Each business you register must have a distinct name (e.g. "${name.trim()} - Branch 2").`;
        if (!firstSummary) firstSummary = errors.name;
      }
    }

    if (isCustomCity && !customCityName.trim()) {
      errors.city = 'Please specify your commercial market city.';
      if (!firstSummary) firstSummary = errors.city;
    }

    if (!categorySearchQuery.trim()) {
      errors.category = 'Please select or enter a commercial category.';
      if (!firstSummary) firstSummary = errors.category;
    }

    // Business phone validation
    const rawPhoneDigits = (phone || mobileNumber).replace(/\D/g, '');
    const cleanPhoneDigits =
      rawPhoneDigits.length === 12 && rawPhoneDigits.startsWith('91')
        ? rawPhoneDigits.slice(2)
        : rawPhoneDigits;

    if (!cleanPhoneDigits) {
      errors.phone = 'Business Phone is required.';
      if (!firstSummary) firstSummary = errors.phone;
    } else if (cleanPhoneDigits.length !== 10 || !/^[6-9]/.test(cleanPhoneDigits)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
      if (!firstSummary) firstSummary = errors.phone;
    }

    // Evidence reference validation
    const evidenceRes = validateEvidenceReference(evidenceType, evidenceReference);
    if (!evidenceRes.valid) {
      errors.evidence = evidenceRes.error || 'Please provide a valid registration reference.';
      if (!firstSummary) firstSummary = errors.evidence;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStep1Error(firstSummary);
      // Accessible auto-focus to first invalid field
      if (errors.name && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (errors.city) {
        // city input
      } else if (errors.category && categoryInputRef.current) {
        categoryInputRef.current.focus();
      } else if (errors.phone && phoneInputRef.current) {
        phoneInputRef.current.focus();
      } else if (errors.evidence && evidenceInputRef.current) {
        evidenceInputRef.current.focus();
      }
      return;
    }

    setStep1Error(null);
    setFieldErrors({});
    goToStep(2);
  };

  // Final Payment & Registration Execution
  const handleConfirmPaymentAndList = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    const effectiveCity = isCustomCity && customCityName.trim() ? customCityName.trim() : selectedCity;
    const effectiveCategory = categorySearchQuery.trim();
    const cleanPhone = phone.replace(/\D/g, '') || mobileNumber.replace(/\D/g, '');
    const cleanWhatsapp = mobileNumber.replace(/\D/g, '') || cleanPhone;

    try {
      const response = await fetch('/api/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          name,
          legalName,
          categoryName: effectiveCategory,
          cityName: effectiveCity,
          stateName: selectedState,
          tagline,
          description,
          website,
          phone: cleanPhone,
          whatsappPhone: cleanWhatsapp,
          email,
          address,
          socialLinks: {
            instagram,
            linkedin,
            whatsapp: cleanWhatsapp,
            facebook,
          },
          evidenceType,
          evidenceReference: evidenceReference.trim(),
          targetPosition,
          qualifyingAmountRupees: currentBidRupees,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setCreatedResult({
        business: data.business,
        urls: data.urls,
      });

      if (data.business) {
        setOwnedBusinesses((prev) => [
          {
            id: data.business.id,
            slug: data.business.slug,
            name: data.business.name,
            legalName: data.business.legalName,
            tagline: data.business.tagline,
            description: data.business.description,
            address: data.business.address,
            phone: data.business.phone,
            whatsappPhone: data.business.whatsappPhone,
            cityName: effectiveCity,
            categoryName: effectiveCategory,
            verificationStatus: data.business.verificationStatus || 'PENDING',
            publicationStatus: data.business.publicationStatus || 'PUBLISHED',
            evidenceType,
            evidenceReference: evidenceReference.trim(),
            evidenceStatus: 'PENDING',
            role: 'Owner',
            createdAt: data.business.createdAt,
          },
          ...prev,
        ]);
      }

      setCurrentStep(4);
      scrollToTop();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to finalize registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: '#FFFFFF', padding: 'var(--space-16)' }}>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading AageOnline Verification Portal...</div>
      </div>
    );
  }

  // SCREEN 1: PHONE NUMBER + OTP LOGIN VERIFICATION
  if (!isPhoneVerified) {
    return (
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          backgroundColor: '#071526',
          borderRadius: '24px',
          padding: 'clamp(28px, 6vw, 44px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#FFFFFF',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '260px',
            height: '140px',
            background: 'radial-gradient(ellipse at center, rgba(234, 88, 12, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <style>{`
          .claim-phone-input:focus {
            border-color: #EA580C !important;
            box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.25) !important;
          }
          .claim-submit-btn:hover {
            background-color: #C2410C !important;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(234, 88, 12, 0.45) !important;
          }
          .claim-submit-btn:active {
            transform: translateY(0);
          }
        `}</style>

        <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(234, 88, 12, 0.12)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              color: '#FB923C',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '14px',
              boxShadow: '0 0 12px rgba(234, 88, 12, 0.1)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#EA580C',
                boxShadow: '0 0 8px #EA580C',
              }}
            />
            Business Owner Identity
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 4.5vw, 28px)',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              margin: '0 0 8px 0',
            }}
          >
            Sign In / Claim Business
          </h1>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.72)',
              fontSize: '14px',
              lineHeight: 1.5,
              margin: '0 auto',
              maxWidth: '380px',
            }}
          >
            Verify access using your WhatsApp Business number.
          </p>
        </div>

        {otpError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              color: '#F87171',
              fontSize: '13px',
              marginBottom: '20px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {otpError}
          </div>
        )}

        {!isOtpSent ? (
          <form
            onSubmit={handleSendOtp}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}
          >
            <div>
              <label
                htmlFor="whatsapp-business-number-input"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#E2E8F0',
                  marginBottom: '4px',
                  letterSpacing: '0.02em',
                }}
              >
                WhatsApp Business Number <span style={{ color: '#EA580C' }}>*</span>
              </label>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '8px',
                }}
              >
                This number will be used to verify access to your business workspace.
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    userSelect: 'none',
                  }}
                >
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  id="whatsapp-business-number-input"
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number"
                  required
                  autoFocus
                  className="claim-phone-input"
                  style={{
                    flex: 1,
                    padding: '13px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all var(--motion-fast)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sendingOtp}
              className="claim-submit-btn"
              style={{
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.02em',
                cursor: sendingOtp ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(234, 88, 12, 0.35)',
                transition: 'all 0.15s ease',
                minHeight: '48px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: sendingOtp ? 0.7 : 1,
              }}
            >
              {sendingOtp ? 'Sending Verification Code...' : 'Get Verification Code →'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative', zIndex: 1 }}
          >
            {otpSuccessMessage && (
              <div
                role="status"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#4ADE80',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>✓</span>
                <span>{otpSuccessMessage}</span>
              </div>
            )}

            <div
              style={{
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', color: '#FB923C', fontWeight: 600 }}>
                Sent to <strong>+91 {mobileNumber}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtpCode('');
                  setOtpError(null);
                  setOtpSuccessMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Change Number
              </button>
            </div>

            <div>
              <label
                htmlFor="verification-otp-code-input"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#E2E8F0',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                Enter 6-Digit Verification Code <span style={{ color: '#EA580C' }}>*</span>
              </label>
              <input
                id="verification-otp-code-input"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                autoFocus
                className="claim-phone-input"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  color: '#FFFFFF',
                  fontSize: '22px',
                  letterSpacing: '0.35em',
                  textAlign: 'center',
                  fontWeight: 800,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
                {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Didn’t receive code?'}
              </span>
              {otpCountdown === 0 && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FB923C',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Resend Code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={verifyingOtp}
              className="claim-submit-btn"
              style={{
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.02em',
                cursor: verifyingOtp ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(234, 88, 12, 0.35)',
                transition: 'all 0.15s ease',
                minHeight: '48px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: verifyingOtp ? 0.7 : 1,
              }}
            >
              {verifyingOtp ? 'Verifying Code...' : 'Verify Code & Access Workspace →'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // SCREEN 2: RETURNING USER WITH EXISTING BUSINESSES ("YOUR BUSINESSES")
  if (isPhoneVerified && viewMode === 'YOUR_BUSINESSES' && ownedBusinesses.length > 0) {
    return (
      <div
        style={{
          maxWidth: '740px',
          margin: '0 auto',
          backgroundColor: '#071526',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(28px, 5vw, 44px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#FFFFFF',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#4ADE80',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <span>✓</span> Authenticated Business Owner (+91 {mobileNumber})
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
              Your Business Profile & Listings
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '14px', margin: 0 }}>
              Review your registered enterprises, manage their workspaces, or register a new business listing.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleSignOut}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-pill)',
                padding: '9px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.22)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              }}
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>

        {/* Informative Session Context Banner */}
        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span>
            💡 You are currently logged in with <strong>+91 {mobileNumber}</strong>. You have <strong>{ownedBusinesses.length}</strong> registered {ownedBusinesses.length === 1 ? 'business listing' : 'business listings'}.
          </span>
        </div>

        {/* Existing Businesses Cards with Complete Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '32px' }}>
          {ownedBusinesses.map((biz) => {
            const isVerified = biz.verificationStatus === 'VERIFIED';
            const isPending = biz.verificationStatus === 'PENDING' || biz.verificationStatus === 'PENDING_VERIFICATION';
            const isPublished = biz.publicationStatus === 'PUBLISHED';
            return (
              <div
                key={biz.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: isVerified ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Accent stripe */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: isVerified ? '#22C55E' : '#F59E0B',
                  }}
                />

                {/* Card Header: Title + Status Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px 0', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                      {biz.name}
                    </h2>
                    {biz.legalName && biz.legalName !== biz.name && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 500 }}>
                        Legal Entity: <strong>{biz.legalName}</strong>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: isVerified ? 'rgba(34, 197, 94, 0.15)' : isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                        color: isVerified ? '#4ADE80' : isPending ? '#FBBF24' : '#CBD5E1',
                        border: isVerified ? '1px solid rgba(34, 197, 94, 0.35)' : isPending ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {isVerified ? '✓ Verified Entity' : isPending ? '⏳ Pending Verification' : biz.verificationStatus}
                    </span>

                    {isPublished && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: '#93C5FD',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        ● Live in Market
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'rgba(234, 88, 12, 0.15)',
                        color: '#FB923C',
                        border: '1px solid rgba(234, 88, 12, 0.3)',
                      }}
                    >
                      {biz.role || 'Owner'}
                    </span>
                  </div>
                </div>

                {/* Tagline / Description */}
                {biz.tagline && (
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', fontStyle: 'italic' }}>
                    &ldquo;{biz.tagline}&rdquo;
                  </p>
                )}

                {/* Details Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '18px',
                    fontSize: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Primary Market
                    </span>
                    <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>
                      📍 {biz.cityName || 'Pan-India'} • 🏷️ {biz.categoryName || 'Commercial'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Verified Contact
                    </span>
                    <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>
                      📞 {biz.phone || biz.whatsappPhone || ('+91 ' + mobileNumber)}
                    </strong>
                  </div>

                  {biz.evidenceReference && (
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Commercial Evidence
                      </span>
                      <strong style={{ color: '#FFFFFF', fontSize: '13px' }}>
                        🛡️ {biz.evidenceType || 'GSTIN'}: {biz.evidenceReference}
                      </strong>
                    </div>
                  )}

                  {biz.address && (
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Registered Address
                      </span>
                      <strong style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px' }}>
                        🏢 {biz.address}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href={`/business/dashboard?businessId=${encodeURIComponent(biz.id)}`}
                      style={{
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF',
                        padding: '9px 20px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '13px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                      }}
                    >
                      <span>Open Workspace</span>
                      <span>→</span>
                    </Link>

                    <Link
                      href={`/business/workspace?businessId=${encodeURIComponent(biz.id)}`}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        padding: '9px 18px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Profile Editor</span>
                      <span>↗</span>
                    </Link>
                  </div>

                  {biz.slug && (
                    <Link
                      href={`/businesses/${encodeURIComponent(biz.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '12px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>View Public Listing</span>
                      <span>↗</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Option to Add New Listing while old listings are visible */}
        <div
          style={{
            backgroundColor: 'rgba(234, 88, 12, 0.06)',
            border: '2px dashed rgba(234, 88, 12, 0.45)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏢 ➕</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#FFFFFF' }}>
            Add New Business Listing
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.72)', fontSize: '13px', margin: '0 auto 18px auto', maxWidth: '480px' }}>
            Expand your presence: Register an additional business, branch, or market listing under this account. Your existing listings will remain active and visible.
          </p>
          <button
            onClick={handleAddNewListing}
            style={{
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(234, 88, 12, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#C2410C';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#EA580C';
            }}
          >
            <span>+ Add New Listing</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 3: STEP 4 (CONFIRMATION & PENDING VERIFICATION)
  if (currentStep === 4 && createdResult) {
    const { business: b, urls } = createdResult;
    return (
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          backgroundColor: '#071526',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(28px, 5vw, 48px)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#FFFFFF',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid #F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: '#FBBF24',
            fontSize: '32px',
          }}
        >
          ⏳
        </div>

        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '3px 14px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#FBBF24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '12px',
          }}
        >
          Listing Submitted • Pending Commercial Verification
        </span>

        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, margin: '0 0 10px 0' }}>
          {b.name} Successfully Registered!
        </h1>

        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)', maxWidth: '560px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
          Your payment of <strong>₹{totalSettlement.toLocaleString('en-IN')}</strong> was confirmed. Your registration reference and commercial evidence have been saved. Your competitive ranking position has been recorded and will appear once verification is reviewed.
        </p>

        {/* Live Status Indicators */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Target Position
            </span>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#EA580C' }}>
              Rank #{targetPosition}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Verification Status
            </span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#FBBF24' }}>
              Pending Verification ⏳
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
              Assigned Role
            </span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#FCD34D' }}>
              Owner
            </span>
          </div>
        </div>

        {/* Workspace Listing Targets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href={urls.workspaceProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              padding: '14px 24px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 800,
              fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
            }}
          >
            <span>1. Open Business Workspace Profile Editor</span>
            <span>→</span>
          </Link>

          <Link
            href={`/business/dashboard?businessId=${encodeURIComponent(b.id)}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span>2. Go to Dashboard Overview</span>
            <span>→</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setViewMode('YOUR_BUSINESSES');
              setCurrentStep(1);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.8)',
              padding: '12px 24px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 700,
              fontSize: '14px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
            }}
          >
            <span>3. View All Your Businesses</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 4: BUSINESS PROFILE CLAIM & REGISTRATION WIZARD
  return (
    <div
      style={{
        maxWidth: '740px',
        margin: '0 auto',
        backgroundColor: '#071526',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(24px, 5vw, 44px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#FFFFFF',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Existing Registered Listings Section - ALWAYS VISIBLE WHEN ADDING A NEW LISTING FOR RETURNING OWNERS */}
      {ownedBusinesses.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '26px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🏢</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#93C5FD',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  Your Existing Listings ({ownedBusinesses.length})
                </span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '4px 0 0 0', color: '#FFFFFF' }}>
                Active Registered Businesses in Your Account
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('YOUR_BUSINESSES')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-pill)',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <span>← Back to My Businesses Overview</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ownedBusinesses.map((biz) => {
              const isVerified = biz.verificationStatus === 'VERIFIED';
              const isPending = biz.verificationStatus === 'PENDING' || biz.verificationStatus === 'PENDING_VERIFICATION';
              return (
                <div
                  key={biz.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>{biz.name}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: isVerified ? 'rgba(34, 197, 94, 0.15)' : isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                          color: isVerified ? '#4ADE80' : isPending ? '#FBBF24' : '#CBD5E1',
                          border: isVerified ? '1px solid rgba(34, 197, 94, 0.3)' : isPending ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {isVerified ? 'Verified ✓' : isPending ? 'Pending ⏳' : biz.verificationStatus}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: 'rgba(234, 88, 12, 0.15)',
                          color: '#FB923C',
                        }}
                      >
                        {biz.role || 'Owner'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '3px' }}>
                      📍 {biz.cityName || 'Pan-India'} • 🏷️ {biz.categoryName || 'Commercial'}
                      {biz.legalName && ` • Legal: ${biz.legalName}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link
                      href={`/business/dashboard?businessId=${encodeURIComponent(biz.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: 'rgba(234, 88, 12, 0.12)',
                        color: '#FB923C',
                        border: '1px solid rgba(234, 88, 12, 0.35)',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>Open Workspace ↗</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header specifically for adding a new listing when old listings exist */}
      {ownedBusinesses.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(234, 88, 12, 0.12)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              color: '#FB923C',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            <span>+</span> Additional Listing Registration
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0', color: '#FFFFFF' }}>
            Add New Business Listing
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Enter the details for your new business or branch. It will be associated with your authenticated account (+91 {mobileNumber}).
          </p>
        </div>
      )}

      {/* Wizard Step Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 1 ? '#EA580C' : 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            1
          </span>
          <span style={{ fontSize: '13px', fontWeight: currentStep === 1 ? 800 : 500, color: currentStep === 1 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)' }}>
            Business Profile
          </span>
        </div>

        <div style={{ width: '24px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 2 ? '#EA580C' : 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            2
          </span>
          <span style={{ fontSize: '13px', fontWeight: currentStep === 2 ? 800 : 500, color: currentStep === 2 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)' }}>
            Top #1 Position
          </span>
        </div>

        <div style={{ width: '24px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 3 ? '#EA580C' : 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            3
          </span>
          <span style={{ fontSize: '13px', fontWeight: currentStep === 3 ? 800 : 500, color: currentStep === 3 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)' }}>
            Payment & Launch
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#F87171',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* STEP 1: BUSINESS PROFILE & VERIFICATION DETAILS */}
      {currentStep === 1 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0' }}>
            1. Business Profile & Commercial Verification
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Business Name */}
            <div>
              <label htmlFor="claim-business-name" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Business Name <span style={{ color: '#EA580C' }}>*</span>
              </label>
              <input
                id="claim-business-name"
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. Royal Living & Spacecraft Design"
                required
                aria-invalid={!!fieldErrors.name}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: fieldErrors.name ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
              {fieldErrors.name && (
                <p role="alert" style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Legal Entity Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Registered Legal Entity Name
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Royal Living Architectural Solutions LLP"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* PAN-INDIA CASCADING LOCATION: State then City */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Select State / UT (Covering All India) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  State / Union Territory <span style={{ color: '#EA580C' }}>*</span>
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const nextState = e.target.value;
                    setSelectedState(nextState);
                    const stateData = ALL_INDIA_LOCATIONS.find((loc) => loc.state === nextState);
                    if (stateData && stateData.cities.length > 0) {
                      setSelectedCity(stateData.cities[0]);
                      setIsCustomCity(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#0F253E',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                >
                  {ALL_INDIA_LOCATIONS.map((loc) => (
                    <option key={loc.state} value={loc.state}>
                      {loc.state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select City filtered for State, or Custom City */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Market Location (City) <span style={{ color: '#EA580C' }}>*</span>
                </label>
                {!isCustomCity ? (
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomCity(true);
                        setCustomCityName('');
                      } else {
                        setSelectedCity(e.target.value);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#0F253E',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '14px',
                    }}
                  >
                    {currentStateData.cities.map((city) => (
                      <option key={city} value={city}>
                        {city} ({currentStateData.state})
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Enter other city in {selectedState}...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        value={customCityName}
                        onChange={(e) => {
                          setCustomCityName(e.target.value);
                          if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: undefined }));
                        }}
                        placeholder={`Enter city in ${selectedState}`}
                        autoFocus
                        required
                        aria-invalid={!!fieldErrors.city}
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: fieldErrors.city ? '1px solid #EF4444' : '1px solid #EA580C',
                          color: '#FFFFFF',
                          fontSize: '14px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCity(false);
                          if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: undefined }));
                        }}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Reset
                      </button>
                    </div>
                    {fieldErrors.city && (
                      <p role="alert" style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>
                        {fieldErrors.city}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SMART SEARCHABLE CATEGORY INPUT WITH AUTOCOMPLETE & NEW CATEGORY CREATION */}
            <div ref={categoryContainerRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Commercial Category <span style={{ color: '#EA580C' }}>*</span>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 400, marginLeft: '6px' }}>
                  (Type to search or create any custom business category)
                </span>
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  ref={categoryInputRef}
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => {
                    setCategorySearchQuery(e.target.value);
                    setIsCategoryDropdownOpen(true);
                    if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                  placeholder="e.g. Interior Designers, Modular Kitchens, Dentists..."
                  required
                  aria-invalid={!!fieldErrors.category}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: fieldErrors.category ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />

                {isCategoryDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      maxHeight: '260px',
                      overflowY: 'auto',
                      backgroundColor: '#07172C',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
                      zIndex: 100,
                      padding: '6px',
                    }}
                  >
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((catName) => (
                        <div
                          key={catName}
                          onClick={() => {
                            setCategorySearchQuery(catName);
                            setIsCategoryDropdownOpen(false);
                            if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: undefined }));
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: catName === categorySearchQuery ? '#FB923C' : '#FFFFFF',
                            backgroundColor: catName === categorySearchQuery ? 'rgba(234, 88, 12, 0.15)' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              catName === categorySearchQuery ? 'rgba(234, 88, 12, 0.15)' : 'transparent')
                          }
                        >
                          {catName}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px 14px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        No existing preset matched your search.
                      </div>
                    )}

                    {/* Option to create new custom category if not exact match */}
                    {!hasExactCategoryMatch && categorySearchQuery.trim().length >= 2 && (
                      <div
                        onClick={() => {
                          setIsCategoryDropdownOpen(false);
                          if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: undefined }));
                        }}
                        style={{
                          marginTop: '4px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#4ADE80',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        }}
                      >
                        ✨ Create new category: &ldquo;{categorySearchQuery.trim()}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
              {fieldErrors.category && (
                <p role="alert" style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>
                  {fieldErrors.category}
                </p>
              )}
            </div>

            {/* Tagline */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Brand Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Modern living spaces, bespoke execution & turnkey interiors."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Business Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Comprehensive description of business specializations, clientele, and scope of services."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Contact Endpoints */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Business Phone <span style={{ color: '#EA580C' }}>*</span>
                </label>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="+91 98765 43210"
                  required
                  aria-invalid={!!fieldErrors.phone}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: fieldErrors.phone ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px', display: 'block' }}>
                  Primary phone for customer inquiries (prefilled, editable).
                </span>
                {fieldErrors.phone && (
                  <p role="alert" style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Official Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourbrand.example.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px', display: 'block' }}>
                  Optional public portfolio or website address.
                </span>
              </div>
            </div>

            {/* Physical Address */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop / Office No, Street, Commercial Complex, Pincode"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Social Media Links & WhatsApp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Instagram Profile URL
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/your_handle"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  <span>
                    WhatsApp Business <span style={{ color: '#EA580C' }}>*</span>
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 700 }}>
                    🔒 Verified Identity Locked
                  </span>
                </label>
                <input
                  type="text"
                  value={whatsapp ? (whatsapp.startsWith('+91') ? whatsapp : `+91 ${whatsapp}`) : (mobileNumber ? `+91 ${mobileNumber}` : '')}
                  readOnly
                  disabled
                  title="WhatsApp Business number is locked to your verified login number."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#BAE6FD',
                    fontSize: '14px',
                    cursor: 'not-allowed',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'rgba(56, 189, 248, 0.8)', marginTop: '4px', display: 'block' }}>
                  Bound to your verified WhatsApp owner identity. Protected from unauthorized tampering.
                </span>
              </div>
            </div>

            {/* Commercial Evidence Verification */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Evidence Type <span style={{ color: '#EA580C' }}>*</span>
                </label>
                <select
                  value={evidenceType}
                  onChange={(e) => {
                    const nextType = e.target.value as ClaimEvidenceType;
                    setEvidenceType(nextType);
                    if (fieldErrors.evidence) setFieldErrors((prev) => ({ ...prev, evidence: undefined }));
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#0F253E',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                >
                  <option value="GSTIN">GSTIN (Commercial Tax ID)</option>
                  <option value="UDYAM">Udyam Registration</option>
                  <option value="SHOP_ESTABLISHMENT">Shop & Establishment License</option>
                  <option value="COMMERCIAL_PAN">Commercial PAN</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Registration Number / Reference <span style={{ color: '#EA580C' }}>*</span>
                </label>
                <input
                  ref={evidenceInputRef}
                  type="text"
                  value={evidenceReference}
                  onChange={(e) => {
                    setEvidenceReference(e.target.value);
                    if (fieldErrors.evidence) setFieldErrors((prev) => ({ ...prev, evidence: undefined }));
                  }}
                  placeholder={
                    evidenceType === 'GSTIN'
                      ? 'e.g. 08AAAAA0000A1Z5 (15 characters)'
                      : evidenceType === 'UDYAM'
                      ? 'e.g. UDYAM-RJ-14-0012345'
                      : evidenceType === 'SHOP_ESTABLISHMENT'
                      ? 'e.g. RJ/JPR/EST/2023/1234'
                      : 'e.g. AABCR1234F (10 characters)'
                  }
                  required
                  aria-invalid={!!fieldErrors.evidence}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: fieldErrors.evidence ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px', display: 'block' }}>
                  Strictly format-validated. Saved with initial status &ldquo;Pending Verification&rdquo;.
                </span>
                {fieldErrors.evidence && (
                  <p role="alert" style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>
                    {fieldErrors.evidence}
                  </p>
                )}
              </div>
            </div>

            {/* Accessible Error Summary Alert (Immediate Feedback right above action button) */}
            {step1Error && (
              <div
                role="alert"
                aria-live="assertive"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  color: '#FCA5A5',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                <span>{step1Error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleValidateStep1}
              style={{
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                marginTop: '12px',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
              }}
            >
              Continue to Top #1 Positioning →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: POSITION CONFIRMATION & TRANSPARENT PRICING */}
      {currentStep === 2 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>
            2. Secure Top #1 Visibility Position
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Your business will secure the premier <strong>#1 ranking position</strong> inside{' '}
            <strong>
              {isCustomCity ? customCityName : selectedCity} ({selectedState}) × {categorySearchQuery}
            </strong>{' '}
            so that you appear first on the website for maximum customer discovery.
          </p>

          {/* 1. CURRENT TOP MEMBER OF THIS CATEGORY */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              Current Top #1 Member in this Category
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', display: 'block', marginBottom: '2px' }}>
                  {topRankMember.name}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: topRankMember.isExisting ? '#4ADE80' : '#FCD34D' }}>
                  {topRankMember.isExisting
                    ? '● Currently Holding Rank #1 (Spotlight Position)'
                    : '○ Unclaimed Market Ladder (Be the First to Claim #1)'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                  Current Top Qualifying Bid:
                </span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#FB923C' }}>
                  ₹{topRankMember.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* 2. GUARANTEED TOP 1 SPOTLIGHT POSITION CARD (NO GST) */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                padding: '20px 24px',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid #EA580C',
                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.2)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF' }}>
                    Position #1 (Spotlight Rank)
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: '#EA580C',
                      color: '#FFFFFF',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Guaranteed Top 1
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.75)', display: 'block', maxWidth: '440px', lineHeight: 1.4 }}>
                  Authoritative qualifying ranking position to appear first on the website for verified customer traffic.
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#EA580C' }}>
                  ₹{currentBidRupees.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* 3. MANUAL AMOUNT INPUT (NO DECIMALS/POINTS, CANNOT BE LOWER THAN TOP) */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isBidTooLow ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                Choose Your Visibility Amount (₹) <span style={{ color: '#EA580C' }}>*</span>
              </label>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Whole Rupees only (no points/decimals)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <div
                style={{
                  padding: '12px 18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontSize: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                ₹
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={manualAmount}
                onChange={(e) => {
                  // Strictly strip any non-digit character (disallows points, decimals, commas, negatives, letters)
                  const clean = e.target.value.replace(/\D/g, '');
                  setManualAmount(clean);
                }}
                onKeyDown={(e) => {
                  if (['.', ',', '-', 'e', 'E', '+'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder={minRequiredRupees.toString()}
                required
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${isBidTooLow ? '#EF4444' : '#EA580C'}`,
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              />
            </div>

            {/* Quick Adjustment Increment Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setManualAmount(minRequiredRupees.toString())}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(234, 88, 12, 0.15)',
                  border: '1px solid #EA580C',
                  color: '#FB923C',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Reset to Min: ₹{minRequiredRupees.toLocaleString('en-IN')} (Higher than last price)
              </button>
              <button
                type="button"
                onClick={() => setManualAmount((Math.max(currentBidRupees, minRequiredRupees) + 1000).toString())}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + ₹1,000
              </button>
              <button
                type="button"
                onClick={() => setManualAmount((Math.max(currentBidRupees, minRequiredRupees) + 5000).toString())}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + ₹5,000
              </button>
              <button
                type="button"
                onClick={() => setManualAmount((Math.max(currentBidRupees, minRequiredRupees) + 10000).toString())}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + ₹10,000
              </button>
            </div>

            {/* Validation Feedback */}
            {isBidTooLow ? (
              <div style={{ color: '#F87171', fontSize: '12px', fontWeight: 700, lineHeight: 1.4 }}>
                ⚠️ To overtake and claim Position #1, your amount must be higher than the last price (Minimum required: ₹{minRequiredRupees.toLocaleString('en-IN')}). You cannot enter the same or less.
              </div>
            ) : (
              <div style={{ color: '#4ADE80', fontSize: '12px', fontWeight: 600 }}>
                ✓ Valid qualifying amount to overtake and claim Position #1.
              </div>
            )}
          </div>

          {/* 4. TOTAL SETTLEMENT SUMMARY (NO GST) */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Spotlight Visibility Payment:</span>
              <span style={{ fontWeight: 800 }}>₹{currentBidRupees.toLocaleString('en-IN')}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 900,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '10px',
                color: '#EA580C',
              }}
            >
              <span>Total Settlement:</span>
              <span>₹{totalSettlement.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Regulatory Disclosures Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '24px' }}>
            <input
              type="checkbox"
              id="terms-check"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <label htmlFor="terms-check" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5, cursor: 'pointer' }}>
              I acknowledge that position rankings on AageOnline represent <strong>paid competitive visibility positions</strong> and
              do not constitute an independent assessment of business quality. All payments purchase designated competitive positions
              and are <strong>non-refundable upon subsequent overtake</strong>.
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => goToStep(1)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={!agreedToTerms || isBidTooLow || !manualAmount.trim()}
              onClick={() => goToStep(3)}
              style={{
                flex: 1,
                backgroundColor: agreedToTerms && !isBidTooLow && manualAmount.trim() ? '#EA580C' : 'rgba(234, 88, 12, 0.4)',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: 800,
                cursor: agreedToTerms && !isBidTooLow && manualAmount.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Proceed to Payment Order →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT ORDER & ATOMIC SETTLEMENT */}
      {currentStep === 3 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>
            3. Authorize Payment & Activate Listing
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Review order details before final execution. Upon confirmation, your ranking position will be atomically registered.
          </p>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '16px' }}>
              <div>
                <span style={{ display: 'block', color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Commercial Entity
                </span>
                <span style={{ fontWeight: 700 }}>{name}</span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Market Ladder
                </span>
                <span style={{ fontWeight: 700 }}>
                  {isCustomCity ? customCityName : selectedCity} ({selectedState}) × {categorySearchQuery}
                </span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Assigned Target Rank
                </span>
                <span style={{ fontWeight: 800, color: '#EA580C' }}>Position #{targetPosition}</span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Payment Method
                </span>
                <span style={{ fontWeight: 700 }}>PayU Verified Instant Settlement</span>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>Total Payable Amount:</span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#4ADE80' }}>
                ₹{totalSettlement.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => goToStep(2)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmPaymentAndList}
              style={{
                flex: 1,
                backgroundColor: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '15px',
                fontWeight: 800,
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
              }}
            >
              {submitting ? 'Confirming Payment & Activating Listing...' : `Authorize & Settle Payment (₹${totalSettlement.toLocaleString('en-IN')}) →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BusinessClaimPage() {
  return (
    <div
      style={{
        backgroundColor: '#071018',
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(234, 88, 12, 0.12) 0%, transparent 60%),
          radial-gradient(circle at 85% 85%, rgba(251, 146, 60, 0.05) 0%, transparent 50%),
          linear-gradient(180deg, #071018 0%, #0B1F33 100%)
        `,
        minHeight: '100vh',
        padding: 'clamp(36px, 6vw, 72px) 16px',
      }}
    >
      <Suspense
        fallback={
          <div style={{ textAlign: 'center', color: '#FFFFFF', padding: 'var(--space-12)' }}>
            Loading AageOnline Verification Portal...
          </div>
        }
      >
        <ClaimFlowContent />
      </Suspense>
    </div>
  );
}
