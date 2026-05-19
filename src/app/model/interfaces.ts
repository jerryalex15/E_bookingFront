export interface UserRequestDto {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    motDePasse: string;
    roleIds: number[];
}

export interface LoginRequest {
    email: string;
    motDePasse: string;
}

export interface AuthResponse {
    token: string;
    type?: string;
    email?: string;
    roles?: string[];
}

// IDs de rôles prédéfinis — à adapter selon ta BDD
export const ROLE_IDS = {
    CLIENT: 1,
    PRO: 2,
    ADMIN: 3,
} as const;

export interface DisponibiliteResponse {
  jourSemaine: string;        // ex: "Lundi"
  heureDebut: string;  // "09:00:00"
  heureFin: string;    // "17:00:00"
}
