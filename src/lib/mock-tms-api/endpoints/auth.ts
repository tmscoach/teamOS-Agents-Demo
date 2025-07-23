/**
 * Mock TMS Auth Endpoints
 * Simulates TMS Global authentication endpoints
 */

import { mockDataStore } from '../mock-data-store';
import { mockTMSClient } from '../mock-api-client';
import { 
  TMSSignupRequest, 
  TMSLoginRequest, 
  TMSAuthResponse, 
  TMSValidateResponse,
  TMSErrorResponse 
} from '../types';

/**
 * POST /api/v1/auth/signup
 * Creates organization and facilitator account
 */
export async function signup(options: { data: TMSSignupRequest }): Promise<TMSAuthResponse> {
  const { Email, Password, FirstName, LastName, OrganizationName } = options.data;

  // Validate input
  if (!Email || !Password || !FirstName || !LastName || !OrganizationName) {
    throw {
      error: 'VALIDATION_ERROR',
      message: 'All fields are required',
      details: { required: ['Email', 'Password', 'FirstName', 'LastName', 'OrganizationName'] }
    } as TMSErrorResponse;
  }

  // Check if user already exists
  const existingUser = mockDataStore.getUserByEmail(Email);
  if (existingUser) {
    throw {
      error: 'USER_EXISTS',
      message: 'A user with this email already exists'
    } as TMSErrorResponse;
  }

  // Create organization
  const org = mockDataStore.createOrganization(OrganizationName, '');
  
  // Create facilitator user
  const user = mockDataStore.createUser({
    email: Email,
    password: Password, // In real API, this would be hashed
    firstName: FirstName,
    lastName: LastName,
    userType: 'Facilitator',
    organizationId: org.id
  });

  // Update org with facilitator ID
  org.facilitatorId = user.id;

  // Generate JWT token
  const token = mockTMSClient.generateJWT({
    sub: user.id,
    UserType: 'Facilitator',
    nameid: user.email,
    organisationId: org.id
  });

  // Update user with token
  user.token = token;

  return {
    token,
    userId: user.id,
    userType: 'Facilitator',
    organizationId: org.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  };
}

/**
 * POST /api/v1/auth/login
 * Facilitator/team manager login
 */
export async function login(options: { data: TMSLoginRequest }): Promise<TMSAuthResponse> {
  console.log('Login function called with options:', options);
  const { Email, Password } = options.data;

  // Validate input
  if (!Email || !Password) {
    throw {
      error: 'VALIDATION_ERROR',
      message: 'Email and password are required'
    } as TMSErrorResponse;
  }

  console.log('Login attempt:', { email: Email, password: Password });
  console.log('All users in store:', Array.from(mockDataStore.users.values()).map(u => ({ 
    id: u.id,
    email: u.email, 
    password: u.password,
    orgId: u.organizationId 
  })));

  // Find user
  const user = mockDataStore.getUserByEmail(Email);
  if (!user) {
    console.log('User not found for email:', Email);
    throw {
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    } as TMSErrorResponse;
  }

  console.log('Found user:', { id: user.id, email: user.email, password: user.password });

  // Check password
  if (user.password !== Password) {
    console.log('Password mismatch:', { provided: Password, expected: user.password });
    throw {
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    } as TMSErrorResponse;
  }

  // Generate new JWT token
  const token = mockTMSClient.generateJWT({
    sub: user.id,
    UserType: user.userType,
    nameid: user.email,
    organisationId: user.organizationId,
    respondentID: user.userType === 'Respondent' ? user.id : undefined
  });

  // Update user token and token mapping
  user.token = token;
  mockDataStore.tokenToUser.set(token, user.id);

  return {
    token,
    userId: user.id,
    userType: user.userType,
    organizationId: user.organizationId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  };
}

/**
 * GET /api/v1/team-os/auth/validate
 * Validate JWT token and get user info
 */
export async function validate(options: { jwt?: string }): Promise<TMSValidateResponse> {
  if (!options.jwt) {
    return {
      valid: false
    };
  }

  // Check if token is expired
  if (mockTMSClient.isTokenExpired(options.jwt)) {
    return {
      valid: false
    };
  }

  // Decode token
  const claims = mockTMSClient.decodeJWT(options.jwt);
  if (!claims) {
    return {
      valid: false
    };
  }

  // Find user by token
  const user = mockDataStore.getUserByToken(options.jwt);
  if (!user) {
    return {
      valid: false
    };
  }

  return {
    valid: true,
    userId: user.id,
    userType: user.userType,
    organizationId: user.organizationId
  };
}

/**
 * POST /Authenticate
 * Respondent/team member login - different endpoint than facilitator
 */
export async function respondentLogin(options: { 
  data: { 
    RespondentEmail: string; 
    RespondentPassword: string;
    MobileAppType?: string;
  } 
}): Promise<{ token: string; version: string; region: string }> {
  const { RespondentEmail, RespondentPassword, MobileAppType = 'teamOS' } = options.data;

  console.log('Respondent login attempt:', { email: RespondentEmail });

  // Validate input
  if (!RespondentEmail || !RespondentPassword) {
    throw {
      error: 'VALIDATION_ERROR',
      message: 'Email and password are required'
    } as TMSErrorResponse;
  }

  // Find user by email (respondents have same email lookup)
  const user = mockDataStore.getUserByEmail(RespondentEmail);
  if (!user || user.userType !== 'Respondent') {
    console.log('Respondent not found or wrong user type');
    throw {
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    } as TMSErrorResponse;
  }

  // Check password
  if (user.password !== RespondentPassword) {
    throw {
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    } as TMSErrorResponse;
  }

  // Generate JWT token with respondentID claim
  const token = mockTMSClient.generateJWT({
    respondentID: user.id.replace('user-', ''), // Extract numeric part for compatibility
    lastModified: Date.now().toString(),
    mobileAppType: MobileAppType,
    iss: 'TMS.Global',
    aud: 'TMS.Global'
  });

  // Update token mapping
  mockDataStore.tokenToUser.set(token, user.id);

  return {
    token,
    version: '7',
    region: 'AU' // Mock region, could be dynamic based on org
  };
}

/**
 * Helper function to create a respondent user
 * This would be called by team management tools
 */
export async function createRespondent(data: {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  teamId?: string;
}): Promise<TMSAuthResponse> {
  // Check if user already exists
  const existingUser = mockDataStore.getUserByEmail(data.email);
  if (existingUser) {
    throw {
      error: 'USER_EXISTS',
      message: 'A user with this email already exists'
    } as TMSErrorResponse;
  }

  // Create respondent user with default password
  const user = mockDataStore.createUser({
    email: data.email,
    password: 'Welcome123!', // Default password for new respondents
    firstName: data.firstName,
    lastName: data.lastName,
    userType: 'Respondent',
    organizationId: data.organizationId
  });

  // Generate JWT token
  const token = mockTMSClient.generateJWT({
    sub: user.id,
    UserType: 'Respondent',
    respondentID: user.id,
    nameid: user.email,
    organisationId: data.organizationId
  });

  // Update user with token
  user.token = token;

  return {
    token,
    userId: user.id,
    userType: 'Respondent',
    organizationId: data.organizationId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  };
}