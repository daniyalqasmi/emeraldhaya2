/**
 * Strict Pakistani Phone Number Validator & Formatter
 * 
 * Pakistan Mobile Number Structure:
 * - 11 digits starting with 03 (e.g. 0300 1234567)
 * - Or 12-13 digits with country code (+923001234567, 923001234567, 00923001234567)
 * - Network codes: 0300-0309 (Jazz/Mobilink), 0310-0318 (Zong), 0320-0325 (Warid),
 *   0330-0337 (Ufone), 0340-0349 (Telenor), 0355 (SCOM)
 * 
 * Rejects "faltu" / fake / dummy numbers:
 * - All identical digits (e.g. 11111111111, 00000000000, 99999999999)
 * - Trivial sequential patterns (e.g. 12345678901, 01234567890)
 * - Dummy numbers where the subscriber portion is all identical (e.g. 03000000000, 03111111111, 03222222222)
 * - Invalid length or invalid operator code
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // standard 03XXXXXXXXX format (11 digits)
  formatted: string;  // user-friendly 03XX-XXXXXXX format
  international: string; // +923XXXXXXXXX format for WhatsApp
  error?: string;
}

// Valid Pakistani mobile operator prefixes (0300 to 0349, and 0355)
const VALID_OPERATOR_PREFIXES = new Set([
  // Jazz / Mobilink
  '0300', '0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309',
  // Zong
  '0310', '0311', '0312', '0313', '0314', '0315', '0316', '0317', '0318',
  // Warid
  '0320', '0321', '0322', '0323', '0324', '0325',
  // Ufone
  '0330', '0331', '0332', '0333', '0334', '0335', '0336', '0337',
  // Telenor
  '0340', '0341', '0342', '0343', '0344', '0345', '0346', '0347', '0348', '0349',
  // SCOM (AJK / GB)
  '0355'
]);

export function validatePakistaniPhoneNumber(rawInput: string): PhoneValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      international: '',
      error: 'Barahe karam apna WhatsApp phone number darj karein.'
    };
  }

  // Extract digits only
  const digits = rawInput.replace(/[^0-9]/g, '');

  if (digits.length === 0) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      international: '',
      error: 'Phone number darj karna zaroori hai.'
    };
  }

  // Normalize to 11-digit 03XXXXXXXXX
  let normalized = '';

  if (digits.startsWith('923') && digits.length === 12) {
    normalized = '0' + digits.slice(2);
  } else if (digits.startsWith('00923') && digits.length === 14) {
    normalized = '0' + digits.slice(4);
  } else if (digits.startsWith('03') && digits.length === 11) {
    normalized = digits;
  } else if (digits.startsWith('3') && digits.length === 10) {
    normalized = '0' + digits;
  } else {
    // Length or start mismatch
    if (digits.length < 11) {
      return {
        isValid: false,
        normalized: digits,
        formatted: digits,
        international: digits,
        error: `Number na-mukammal hai (${digits.length}/11 digits). Pakistani number 11 hendson ka hona chahiye (e.g. 03001234567).`
      };
    }
    return {
      isValid: false,
      normalized: digits,
      formatted: digits,
      international: digits,
      error: 'Barahe karam sahi Pakistani mobile number darj karein jo 03 se shuru ho (e.g. 03001234567).'
    };
  }

  // Verify exactly 11 digits starting with 03
  if (!/^03[0-9]{9}$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      formatted: normalized,
      international: '+92' + normalized.slice(1),
      error: 'Pakistani mobile number 03 se shuru hona chahiye (e.g. 03001234567).'
    };
  }

  // Check operator prefix (first 4 digits)
  const prefix = normalized.slice(0, 4);
  if (!VALID_OPERATOR_PREFIXES.has(prefix)) {
    return {
      isValid: false,
      normalized,
      formatted: `${prefix}-${normalized.slice(4)}`,
      international: '+92' + normalized.slice(1),
      error: `Network code "${prefix}" durust nahi hai. Pakistani networks (Jazz 030X, Zong 031X, Warid 032X, Ufone 033X, Telenor 034X) qabil-e-qabool hain.`
    };
  }

  // Check for fake/dummy/repetitive numbers (e.g. 03000000000, 03111111111, 03333333333)
  const subscriberPart = normalized.slice(4); // 7 digits
  const allIdenticalInSub = subscriberPart.split('').every((char) => char === subscriberPart[0]);
  if (allIdenticalInSub) {
    return {
      isValid: false,
      normalized,
      formatted: `${prefix}-${subscriberPart}`,
      international: '+92' + normalized.slice(1),
      error: 'Ye faltu / nakli number lag raha hai. Barahe karam apna asal aur faal mobile number darj karein.'
    };
  }

  // Check sequential sequences like 1234567 or 7654321
  if (
    subscriberPart === '1234567' ||
    subscriberPart === '7654321' ||
    subscriberPart === '0123456' ||
    subscriberPart === '9876543' ||
    normalized === '03001234567' // common example number
  ) {
    return {
      isValid: false,
      normalized,
      formatted: `${prefix}-${subscriberPart}`,
      international: '+92' + normalized.slice(1),
      error: 'Barahe karam test ya sample number na dalein, apna asal mobile number darj karein.'
    };
  }

  const formatted = `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
  const international = `+92${normalized.slice(1)}`;

  return {
    isValid: true,
    normalized,
    formatted,
    international
  };
}
