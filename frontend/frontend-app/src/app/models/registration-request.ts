export interface RegistrationRequest {
    id: number;
    name: string;
    email: string;
    programa?: string;
    role_solicitado?: string;
    reason?: string;
    created_at?: string;
}