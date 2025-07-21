export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  // 사용자 관리 설정
  'user.default_role': string;
  'user.allow_registration': boolean;
  'user.require_email_verification': boolean;
  
  // 설문 시스템 설정
  'survey.default_active': boolean;
  'survey.default_allow_anonymous': boolean;
  'survey.response_retention_days': number;
  'survey.max_surveys_per_user': number;
  
  // 보안 설정
  'security.session_timeout_minutes': number;
  'security.password_min_length': number;
  'security.require_special_char': boolean;
  'security.max_login_attempts': number;
  
  // 시스템 정보
  'system.version': string;
  'system.maintenance_mode': boolean;
}

export type SettingCategory = 'user_management' | 'survey_system' | 'security' | 'system_info';

export interface SettingCategoryInfo {
  id: SettingCategory;
  name: string;
  description: string;
  icon: string;
}

export const SETTING_CATEGORIES: SettingCategoryInfo[] = [
  {
    id: 'user_management',
    name: '사용자 관리',
    description: '사용자 등록, 역할, 인증 관련 설정',
    icon: '👥'
  },
  {
    id: 'survey_system',
    name: '설문 시스템',
    description: '설문 생성, 응답, 보관 관련 설정',
    icon: '📊'
  },
  {
    id: 'security',
    name: '보안',
    description: '보안, 세션, 비밀번호 정책 설정',
    icon: '🔒'
  },
  {
    id: 'system_info',
    name: '시스템 정보',
    description: '시스템 버전, 상태, 유지보수 설정',
    icon: '⚙️'
  }
]; 