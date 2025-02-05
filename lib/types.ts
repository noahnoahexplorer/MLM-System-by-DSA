export interface MLMNetworkData {
  MERCHANT_ID: string;
  CURRENCY: string;
  MEMBER_ID: string;
  MEMBER_LOGIN: string;
  REFERRER_ID: string | null;
  REFERRER_LOGIN: string | null;
  CREATED_DATE: string;
  DESCENDANTS_PATH_ID: string;
  DESCENDANTS_LOGIN: string;
  SELF_NGR: number;
  TIER1_DAILY_NGR: number;
  TIER2_DAILY_NGR: number;
  TIER3_DAILY_NGR: number;
  TIER1_COMMISSION: number;
  TIER2_COMMISSION: number;
  TIER3_COMMISSION: number;
  TOTAL_VALID_BET_AMOUNT: number;
  TOTAL_DEPOSIT: number;
  FTD_DATE: string | null;
  FTD_AMOUNT: number | null;
  MEMBERSHIP_LEVEL: string;
  SUMMARIZE_DATE: string;
}

export interface DailyCommission {
  SUMMARY_MONTH: string;
  MERCHANT_ID: string;
  MEMBER_ID: string;
  MEMBER_LOGIN: string;
  MEMBER_CURRENCY: string;
  RELATIVE_LEVEL: number;
  RELATIVE_LEVEL_REFEREE: string;
  TOTAL_DEPOSIT_AMOUNT: number;
  TOTAL_WIN_LOSS: number;
  TOTAL_VALID_TURNOVER: number;
  BASE_TOTAL_VALID_TURNOVER: number;
  COMMISSION_RATE: number;
  BASE_COMMISSION_AMOUNT: number;
  GLOBAL_MULTIPLIER: number;
  LOCAL_COMMISSION_AMOUNT: number;
}

export interface ReferralNetwork {
  MERCHANT_ID: string;
  REFERRER_ID: string;
  REFERRER_LOGIN: string;
  REFERRER_CURRENCY: string;
  REFEREE_ID: string;
  REFEREE_LOGIN: string;
  REFEREE_CURRENCY: string;
  CREATED_DATE: string;
  LEVEL: number;
  HIERARCHY: string;
}

export interface Member {
  memberId: string;
  memberLogin: string;
  SUMMARY_MONTH: string;
  currency: string;
  totalNGR: number;
  totalCommission: number;
  referralCount: number;
} 