export interface PersonalSectionDTO {
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday: string; // YYYY-MM-DD
  fatherName?: string;
  gender?: 'male' | 'female';
  maritalStatus?: 'single' | 'married' | 'unmarried' | 'prefer_not_to_disclose';
}

export interface IdentificationSectionDTO {
  govenmentId?: string;
  identificationNumber?: string;
  nationalId?: string;
  taxPayerNumber?: string;
  countryCode?: string; // e.g. +237
  mobileNumber?: string;
  email?: string;
  secondaryCountryCode?: string;
  secondaryMobileNumber?: string;
  secondaryEmail?: string;
}

export interface BankSectionDTO {
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountType?: 'savings' | 'current' | 'salary';
}

export interface ApiStandardResponse {
  id?: string;
  message?: string;
}


