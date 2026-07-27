export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    otp?: string;
    otpExpiresAt?: string;
    otpFailedAttempts?: number;
    otpLockoutUntil?: string;
}
export interface Project {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    isPublic: boolean;
    tailwindConfig?: string;
    createdAt: string;
}
export interface ComponentProp {
    name: string;
    type: string;
    defaultValue?: string;
    required: boolean;
    description?: string;
}
export interface Component {
    id: string;
    projectId: string;
    name: string;
    description: string;
    code: string;
    props: ComponentProp[];
    createdAt: string;
    updatedAt: string;
}
export declare const db: {
    getUsers: () => Promise<User[]>;
    getUserById: (id: string) => Promise<User | undefined>;
    getUserByUsername: (username: string) => Promise<User | undefined>;
    getUserByEmail: (email: string) => Promise<User | undefined>;
    addUser: (user: User) => Promise<void>;
    updateUser: (userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<User | undefined>;
    getProjects: () => Promise<Project[]>;
    getProjectById: (id: string) => Promise<Project | undefined>;
    getProjectsByOwner: (ownerId: string) => Promise<Project[]>;
    addProject: (project: Project) => Promise<void>;
    updateProject: (projectId: string, updates: Partial<Omit<Project, 'id' | 'ownerId' | 'createdAt'>>) => Promise<Project | undefined>;
    deleteProject: (projectId: string) => Promise<boolean>;
    getComponents: (projectId: string) => Promise<Component[]>;
    getComponentById: (id: string) => Promise<Component | undefined>;
    addComponent: (component: Component) => Promise<void>;
    updateComponent: (componentId: string, updates: Partial<Omit<Component, 'id' | 'projectId' | 'createdAt'>>) => Promise<Component | undefined>;
    deleteComponent: (componentId: string) => Promise<boolean>;
};
//# sourceMappingURL=db.d.ts.map