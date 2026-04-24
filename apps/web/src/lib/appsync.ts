import { appConfig } from './config';

export type Viewer = {
  userId: string;
  email?: string;
  status: 'PENDING_PROFILE' | 'ACTIVE' | 'BLOCKED';
  profileCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type MyProfile = {
  userId: string;
  email?: string;
  status: 'PENDING_PROFILE' | 'ACTIVE' | 'BLOCKED';
  profileCompleted: boolean;
  displayName?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  userId: string;
  displayName: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
  photoUrl?: string;
};

export type UpdateProfileInput = {
  displayName?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
};

export type ReactionResult = {
  success: boolean;
  matched: boolean;
  targetUserId: string;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

//Cognito の ID トークンを使って AppSync に GraphQL リクエストを送る
async function graphqlRequest<TData>(query: string, variables: Record<string, unknown>, idToken: string): Promise<TData> {
  const response = await fetch(appConfig.appSync.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: idToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const payload = (await response.json()) as GraphqlResponse<TData>;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? 'GraphQL error');
  }

  if (!payload.data) {
    throw new Error('GraphQL response has no data');
  }

  return payload.data;
}

const ENSURE_ME_MUTATION = /* GraphQL */ `
  mutation EnsureMe {
    ensureMe {
      userId
      email
      status
      profileCompleted
      createdAt
    }
  }
`;

const ME_QUERY = /* GraphQL */ `
  query Me {
    me {
      userId
      email
      status
      profileCompleted
      createdAt
    }
  }
`;

const UPDATE_PROFILE_MUTATION = /* GraphQL */ `
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      userId
      email
      status
      profileCompleted
      displayName
      age
      gender
      bio
      photoUrl
      createdAt
      updatedAt
    }
  }
`;

const LIST_POTENTIAL_MATCHES_QUERY = /* GraphQL */ `
  query ListPotentialMatches($limit: Int) {
    listPotentialMatches(limit: $limit) {
      userId
      displayName
      age
      gender
      bio
      photoUrl
    }
  }
`;

const REACT_TO_USER_MUTATION = /* GraphQL */ `
  mutation ReactToUser($targetUserId: ID!, $action: ReactionType!) {
    reactToUser(targetUserId: $targetUserId, action: $action) {
      success
      matched
      targetUserId
    }
  }
`;

//初回ログイン時のユーザー作成と、以降のセッション確認で使う関数を定義
export async function ensureMe(idToken: string): Promise<Viewer> {
  const data = await graphqlRequest<{ ensureMe: Viewer }>(ENSURE_ME_MUTATION, {}, idToken);
  return data.ensureMe;
}
//プロフィール取得
export async function me(idToken: string): Promise<Viewer> {
  const data = await graphqlRequest<{ me: Viewer }>(ME_QUERY, {}, idToken);
  return data.me;
}

//プロフィール更新
export async function updateMyProfile(input: UpdateProfileInput, idToken: string): Promise<MyProfile> {
  const data = await graphqlRequest<{ updateMyProfile: MyProfile }>(
    UPDATE_PROFILE_MUTATION,
    { input },
    idToken
  );
  return data.updateMyProfile;
}

//マッチング候補取得
export async function listPotentialMatches(limit: number, idToken: string): Promise<UserProfile[]> {
  const data = await graphqlRequest<{ listPotentialMatches: UserProfile[] }>(
    LIST_POTENTIAL_MATCHES_QUERY,
    { limit },
    idToken
  );
  return data.listPotentialMatches;
}

//Like/Pass アクション
export async function reactToUser(
  targetUserId: string,
  action: 'LIKE' | 'PASS',
  idToken: string
): Promise<ReactionResult> {
  const data = await graphqlRequest<{ reactToUser: ReactionResult }>(
    REACT_TO_USER_MUTATION,
    { targetUserId, action },
    idToken
  );
  return data.reactToUser;
}
