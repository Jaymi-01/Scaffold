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
export interface DatabaseSchema {
    users: User[];
    projects: Project[];
    components: Component[];
}
export declare const db: {
    getUsers: () => User[];
    getUserById: (id: string) => User | undefined;
    getUserByUsername: (username: string) => User | undefined;
    getUserByEmail: (email: string) => User | undefined;
    addUser: (user: User) => void;
    updateUser: (userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => User | undefined;
    getProjects: () => Project[];
    getProjectById: (id: string) => Project | undefined;
    getProjectsByOwner: (ownerId: string) => Project[];
    addProject: (project: Project) => void;
    updateProject: (projectId: string, updates: Partial<Omit<Project, 'id' | 'ownerId' | 'createdAt'>>) => Project | undefined;
    deleteProject: (projectId: string) => boolean;
    getComponents: (projectId: string) => Component[];
    getComponentById: (id: string) => Component | undefined;
    addComponent: (component: Component) => void;
    updateComponent: (componentId: string, updates: Partial<Omit<Component, 'id' | 'projectId' | 'createdAt'>>) => Component | undefined;
    deleteComponent: (componentId: string) => boolean;
};
//# sourceMappingURL=db.d.ts.map