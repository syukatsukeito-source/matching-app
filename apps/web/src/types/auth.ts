export type UserStatus = 'PENDING_PROFILE' | 'ACTIVE' | 'BLOCKED';

export type AuthUser = {
  userId: string;
  email: string;
  status: UserStatus;
  profileCompleted: boolean;
  createdAt: string;
};

export type SignUpInput = {
  email: string;
  password: string;
};

export type ConfirmSignUpInput = {
  email: string;
  code: string;
};

export type SignInInput = {
  email: string;
  password: string;
};
