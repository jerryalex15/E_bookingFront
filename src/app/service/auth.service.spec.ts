import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse, LoginRequest, ROLE_IDS, UserRequestDto } from '../model/interfaces';
import { provideHttpClient } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const BASE_URL = 'http://localhost:8080';

  const mockUserData: Omit<UserRequestDto, 'roleIds'> = {
    email: 'test@test.com',
    motDePasse: 'password123',
    prenom: 'John',
    nom: 'Doe',
    telephone: "0777777777"
  };

  const mockAuthResponse: AuthResponse = {
    token: 'eyJhbGciOiJIUzI1NiJ9.mocktoken',
    roles: ['ROLE_CLIENT'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Nettoyage du localStorage avant chaque test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ─────────────────────────────────────────────────────
  // registerClient
  // ─────────────────────────────────────────────────────

  describe('registerClient()', () => {
    it('devrait envoyer une requête POST avec roleId CLIENT', () => {
      service.registerClient(mockUserData).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/api/users/registration/client`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.roleIds).toContain(ROLE_IDS.CLIENT);
      expect(req.request.body.email).toBe(mockUserData.email);
      req.flush({ message: 'Inscription réussie' });
    });

    it('ne devrait pas inclure de roleId PRO ou ADMIN', () => {
      service.registerClient(mockUserData).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/api/users/registration/client`);
      expect(req.request.body.roleIds).not.toContain(ROLE_IDS.PRO);
      req.flush({});
    });
  });

  // ─────────────────────────────────────────────────────
  // registerPro
  // ─────────────────────────────────────────────────────

  describe('registerPro()', () => {
    it('devrait envoyer une requête POST avec roleId PRO', () => {
      service.registerPro(mockUserData).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/api/users/registration/pro`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.roleIds).toContain(ROLE_IDS.PRO);
      req.flush({ message: 'Inscription pro réussie' });
    });

    it('ne devrait pas inclure de roleId CLIENT', () => {
      service.registerPro(mockUserData).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/api/users/registration/pro`);
      expect(req.request.body.roleIds).not.toContain(ROLE_IDS.CLIENT);
      req.flush({});
    });
  });

  // ─────────────────────────────────────────────────────
  // login
  // ─────────────────────────────────────────────────────

  describe('login()', () => {
    const credentials: LoginRequest = { email: 'test@test.com', motDePasse: 'password123' };

    it('devrait stocker le token dans le localStorage après connexion', () => {
      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/login`);
      req.flush(mockAuthResponse);

      expect(localStorage.getItem('token')).toBe(mockAuthResponse.token);
    });

    it('devrait stocker les rôles dans le localStorage', () => {
      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/login`);
      req.flush(mockAuthResponse);

      const storedRoles = JSON.parse(localStorage.getItem('roles')!);
      expect(storedRoles).toEqual(mockAuthResponse.roles);
    });

    it("ne devrait pas stocker de rôles si la réponse n'en contient pas", () => {
      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/login`);
      req.flush({ token: 'abc' }); // pas de roles

      expect(localStorage.getItem('roles')).toBeNull();
    });

    it('ne devrait pas stocker de token si la réponse est vide', () => {
      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/login`);
      req.flush({});

      expect(localStorage.getItem('token')).toBeNull();
    });

    it('devrait retourner un Observable avec AuthResponse', () => {
      let result: AuthResponse | undefined;
      service.login(credentials).subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${BASE_URL}/login`);
      req.flush(mockAuthResponse);

      expect(result).toEqual(mockAuthResponse);
    });
  });

  // ─────────────────────────────────────────────────────
  // isLoggedIn
  // ─────────────────────────────────────────────────────

  describe('isLoggedIn()', () => {
    it('devrait retourner true si un token est présent', () => {
      localStorage.setItem('token', 'sometoken');
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('devrait retourner false si aucun token', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────────────
  // getToken
  // ─────────────────────────────────────────────────────

  describe('getToken()', () => {
    it('devrait retourner le token stocké', () => {
      localStorage.setItem('token', 'mytoken');
      expect(service.getToken()).toBe('mytoken');
    });

    it('devrait retourner null si aucun token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────
  // getRoles
  // ─────────────────────────────────────────────────────

  describe('getRoles()', () => {
    it('devrait retourner les rôles depuis le localStorage', () => {
      localStorage.setItem('roles', JSON.stringify(['ROLE_CLIENT']));
      expect(service.getRoles()).toEqual(['ROLE_CLIENT']);
    });

    it('devrait retourner un tableau vide si aucun rôle stocké', () => {
      expect(service.getRoles()).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────
  // fetchCurrentUser
  // ─────────────────────────────────────────────────────

  describe('fetchCurrentUser()', () => {
    const mockUser = { id: 1, email: 'test@test.com', roles: ['ROLE_CLIENT'] };

    it('devrait appeler GET /api/auth/me et mettre à jour le BehaviorSubject', () => {
      service.fetchCurrentUser().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/api/auth/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it("devrait mettre à jour currentUserSubject avec l'utilisateur reçu", () => {
      service.fetchCurrentUser().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/api/auth/me`);
      req.flush(mockUser);

      // Accès via getCurrentUser() avec cache
      service.getCurrentUser().subscribe((user) => {
        expect(user).toEqual(mockUser);
      });
      // Pas de nouvelle requête HTTP grâce au cache
      httpMock.expectNone(`${BASE_URL}/api/auth/me`);
    });
  });

  // ─────────────────────────────────────────────────────
  // getCurrentUser
  // ─────────────────────────────────────────────────────

  describe('getCurrentUser()', () => {
    const mockUser = { id: 1, email: 'test@test.com' };

    it("devrait retourner l'utilisateur depuis le cache (BehaviorSubject) sans appel HTTP", () => {
      // Simuler un utilisateur déjà en cache via fetchCurrentUser()
      service.fetchCurrentUser().subscribe();
      httpMock.expectOne(`${BASE_URL}/api/auth/me`).flush(mockUser);

      // Maintenant le cache est peuplé : aucune requête HTTP supplémentaire attendue
      let result: any;
      service.getCurrentUser().subscribe((u) => (result = u));

      httpMock.expectNone(`${BASE_URL}/api/auth/me`);
      expect(result).toEqual(mockUser);
    });

    it('devrait appeler fetchCurrentUser() si token présent mais pas de cache', () => {
      localStorage.setItem('token', 'sometoken');

      service.getCurrentUser().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/api/auth/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('devrait retourner null si pas de token et pas de cache', () => {
      let result: any = 'non-null';
      service.getCurrentUser().subscribe((u) => (result = u));

      httpMock.expectNone(`${BASE_URL}/api/auth/me`);
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────
  // logout
  // ─────────────────────────────────────────────────────

  describe('logout()', () => {
    it('devrait supprimer le token du localStorage', () => {
      localStorage.setItem('token', 'sometoken');
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('devrait supprimer les rôles du localStorage', () => {
      localStorage.setItem('roles', JSON.stringify(['ROLE_CLIENT']));
      service.logout();
      expect(localStorage.getItem('roles')).toBeNull();
    });

    it('devrait réinitialiser le BehaviorSubject à null', () => {
      // Peupler le cache via fetchCurrentUser()
      service.fetchCurrentUser().subscribe();
      httpMock.expectOne(`${BASE_URL}/api/auth/me`).flush({ id: 1 });

      service.logout();

      // Après logout, getCurrentUser() ne doit plus trouver de cache
      // et sans token, doit retourner null
      let result: any = 'non-null';
      service.getCurrentUser().subscribe((u) => (result = u));
      httpMock.expectNone(`${BASE_URL}/api/auth/me`);
      expect(result).toBeNull();
    });
  });
});