import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const loginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockResponse: AuthResponse = {
      token: 'mock-jwt-token',
      user: {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date()
      }
    };

    service.login(loginRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.token).toBe('mock-jwt-token');
      expect(service.currentUserValue).toEqual(mockResponse.user);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(mockResponse);
  });

  it('should register successfully', () => {
    const registerRequest: RegisterRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    const mockResponse: AuthResponse = {
      token: 'mock-jwt-token',
      user: {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date()
      }
    };

    service.register(registerRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isAuthenticated()).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout successfully', () => {
    // First login
    localStorage.setItem('auth_token', 'mock-token');
    localStorage.setItem('current_user', JSON.stringify({ id: '123', username: 'test' }));

    service.logout();

    expect(service.token).toBeNull();
    expect(service.currentUserValue).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
  });

  it('should check authentication status', () => {
    expect(service.isAuthenticated()).toBe(false);

    localStorage.setItem('auth_token', 'mock-token');
    localStorage.setItem('current_user', JSON.stringify({ id: '123', username: 'test' }));

    // Create new instance to pick up localStorage changes
    const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
    expect(newService.isAuthenticated()).toBe(true);
  });
});
