import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, User, Project, Component, ComponentProp } from '../utils/db.js';
import { sendOtpEmail } from '../utils/mailer.js';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router: express.Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'scaffold-secret-key';

// Helper: parse React components props from code (simple regex parser)
function parsePropsFromCode(code: string): ComponentProp[] {
  const props: ComponentProp[] = [];
  
  // Look for TypeScript interface/type defining props, e.g., interface ButtonProps { ... }
  const propInterfaceRegex = /(?:interface|type)\s+(\w+Props)\s*(?:=)?\s*\{([\s\S]*?)\}/g;
  let interfaceMatch;
  
  while ((interfaceMatch = propInterfaceRegex.exec(code)) !== null) {
    const fieldsBody = interfaceMatch[2];
    // Match fields: name?: type; or name: type; or name: type // description
    const fieldRegex = /(\w+)(\?)?\s*:\s*([^;\n]+)/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(fieldsBody)) !== null) {
      const name = fieldMatch[1];
      const isOptional = !!fieldMatch[2];
      let rawType = fieldMatch[3].trim();
      
      // Strip comments
      let description = '';
      if (rawType.includes('//')) {
        const parts = rawType.split('//');
        rawType = parts[0].trim();
        description = parts[1].trim();
      }
      
      // Skip common React children/className props if we want to focus on config props
      if (name === 'children' || name === 'className') continue;
      
      props.push({
        name,
        type: rawType,
        required: !isOptional,
        description: description || undefined
      });
    }
  }
  
  // Fallback: If no TS interface found, try to search for object destructuring in functional component parameters
  if (props.length === 0) {
    const destructureRegex = /(?:const|function)\s+\w+\s*=\s*(?:async\s*)?\(\s*\{([\s\S]*?)\}\s*(?::\s*\w+Props)?\s*\)/;
    const destructureMatch = destructureRegex.exec(code);
    if (destructureMatch) {
      const fields = destructureMatch[1].split(',').map(f => f.trim().split('=')[0].trim());
      fields.forEach(field => {
        if (field && field !== 'children' && field !== 'className' && !field.startsWith('...')) {
          props.push({
            name: field,
            type: 'any',
            required: false
          });
        }
      });
    }
  }
  
  return props;
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

router.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'Username, email, and password are required' });
    return;
  }

  // Check if username or email already exists
  if (await db.getUserByUsername(username)) {
    res.status(400).json({ error: 'Username is already taken' });
    return;
  }

  if (await db.getUserByEmail(email)) {
    res.status(400).json({ error: 'Email is already registered' });
    return;
  }

  const passwordHash = bcryptjs.hashSync(password, 10);
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  await db.addUser(newUser);

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    }
  });
});

router.post('/auth/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    res.status(400).json({ error: 'Username/Email and password are required' });
    return;
  }

  // Find user by username or email
  let user = await db.getUserByUsername(usernameOrEmail);
  if (!user) {
    user = await db.getUserByEmail(usernameOrEmail);
  }

  if (!user || !bcryptjs.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid username, email, or password' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
});

router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const user = await db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'No user registered with this email address' });
    return;
  }

  // Check if user is locked out
  if (user.otpLockoutUntil && new Date(user.otpLockoutUntil).getTime() > Date.now()) {
    const timeLeft = Math.ceil((new Date(user.otpLockoutUntil).getTime() - Date.now()) / 1000);
    const minutesLeft = Math.ceil(timeLeft / 60);
    res.status(429).json({
      error: `Resending code is disabled during lockout. Try again in ${minutesLeft} minute(s).`,
      lockoutUntil: user.otpLockoutUntil
    });
    return;
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 60 * 1000).toISOString(); // 60 seconds expiry

  await db.updateUser(user.id, {
    otp,
    otpExpiresAt,
    otpFailedAttempts: 0,
    otpLockoutUntil: undefined
  });

  await sendOtpEmail(email, otp);

  res.json({
    message: 'OTP sent successfully. Please check your email.',
    email
  });
});

router.post('/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: 'Email and OTP are required' });
    return;
  }

  const user = await db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'No user registered with this email address' });
    return;
  }

  // Check if user is locked out
  if (user.otpLockoutUntil && new Date(user.otpLockoutUntil).getTime() > Date.now()) {
    const timeLeft = Math.ceil((new Date(user.otpLockoutUntil).getTime() - Date.now()) / 1000);
    const minutesLeft = Math.ceil(timeLeft / 60);
    res.status(429).json({
      error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      lockoutUntil: user.otpLockoutUntil
    });
    return;
  }

  if (!user.otp || user.otp !== otp) {
    const attempts = (user.otpFailedAttempts || 0) + 1;
    if (attempts >= 5) {
      const lockoutTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await db.updateUser(user.id, {
        otpFailedAttempts: 0,
        otpLockoutUntil: lockoutTime
      });
      res.status(429).json({
        error: 'Too many failed attempts. You are locked out for 5 minutes.',
        lockoutUntil: lockoutTime
      });
    } else {
      await db.updateUser(user.id, {
        otpFailedAttempts: attempts
      });
      res.status(400).json({ error: 'Incorrect code' });
    }
    return;
  }

  if (!user.otpExpiresAt || new Date(user.otpExpiresAt).getTime() < Date.now()) {
    res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    return;
  }

  const resetToken = crypto.randomUUID();
  const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  await db.updateUser(user.id, {
    otp: undefined,
    otpExpiresAt: undefined,
    otpFailedAttempts: 0,
    otpLockoutUntil: undefined,
    resetToken,
    resetTokenExpiresAt
  });

  res.json({ message: 'OTP verified successfully', resetToken });
});

router.post('/auth/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    res.status(400).json({ error: 'Email, reset token, and new password are required' });
    return;
  }

  const user = await db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'No user registered with this email address' });
    return;
  }

  if (!user.resetToken || user.resetToken !== resetToken) {
    res.status(400).json({ error: 'Invalid password reset session. Please verify your OTP again.' });
    return;
  }

  if (!user.resetTokenExpiresAt || new Date(user.resetTokenExpiresAt).getTime() < Date.now()) {
    res.status(400).json({ error: 'Password reset session has expired. Please request a new code.' });
    return;
  }

  const passwordHash = bcryptjs.hashSync(newPassword, 10);
  await db.updateUser(user.id, {
    passwordHash,
    otp: undefined,
    otpExpiresAt: undefined,
    otpFailedAttempts: 0,
    otpLockoutUntil: undefined,
    resetToken: undefined,
    resetTokenExpiresAt: undefined
  });

  res.json({ message: 'Password has been reset successfully' });
});

router.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------
// PROJECT ENDPOINTS
// ----------------------------------------------------

// Get all projects (public ones, plus owner's private ones if authenticated)
router.get('/projects', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
  const allProjects = await db.getProjects();
  const userId = req.user?.id;

  const visibleProjects = allProjects.filter(
    p => p.isPublic || (userId && p.ownerId === userId)
  );

  res.json({ projects: visibleProjects });
});

// Get user's own projects
router.get('/projects/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const myProjects = await db.getProjectsByOwner(userId);
  res.json({ projects: myProjects });
});

// Get a single project
router.get('/projects/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
  const project = await db.getProjectById(req.params.id as string);
  
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  // Access control
  if (!project.isPublic && (!req.user || project.ownerId !== req.user.id)) {
    res.status(403).json({ error: 'Access denied to this private project' });
    return;
  }

  res.json({ project });
});

// Create a project
router.post('/projects', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { name, description, isPublic, tailwindConfig } = req.body;
  const userId = req.user!.id;

  if (!name) {
    res.status(400).json({ error: 'Project name is required' });
    return;
  }

  const newProject: Project = {
    id: crypto.randomUUID(),
    name,
    description: description || '',
    ownerId: userId,
    isPublic: isPublic !== undefined ? isPublic : true,
    tailwindConfig: tailwindConfig || '',
    createdAt: new Date().toISOString()
  };

  await db.addProject(newProject);
  res.status(201).json({ project: newProject });
});

// Update a project
router.put('/projects/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const project = await db.getProjectById(req.params.id as string);
  const userId = req.user!.id;

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (project.ownerId !== userId) {
    res.status(403).json({ error: 'You are not authorized to update this project' });
    return;
  }

  const { name, description, isPublic, tailwindConfig } = req.body;
  
  const updated = await db.updateProject(req.params.id as string, {
    name: name !== undefined ? name : project.name,
    description: description !== undefined ? description : project.description,
    isPublic: isPublic !== undefined ? isPublic : project.isPublic,
    tailwindConfig: tailwindConfig !== undefined ? tailwindConfig : project.tailwindConfig
  });

  res.json({ project: updated });
});

// Delete a project
router.delete('/projects/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const project = await db.getProjectById(req.params.id as string);
  const userId = req.user!.id;

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (project.ownerId !== userId) {
    res.status(403).json({ error: 'You are not authorized to delete this project' });
    return;
  }

  await db.deleteProject(req.params.id as string);
  res.json({ message: 'Project deleted successfully' });
});

// ----------------------------------------------------
// COMPONENT ENDPOINTS
// ----------------------------------------------------

// Get components for a project
router.get('/projects/:projectId/components', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
  const project = await db.getProjectById(req.params.projectId as string);
  
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  // Access control
  if (!project.isPublic && (!req.user || project.ownerId !== req.user.id)) {
    res.status(403).json({ error: 'Access denied to this project\'s components' });
    return;
  }

  const components = await db.getComponents(req.params.projectId as string);
  res.json({ components });
});

// Get single component details
router.get('/components/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
  const component = await db.getComponentById(req.params.id as string);
  if (!component) {
    res.status(404).json({ error: 'Component not found' });
    return;
  }

  const project = await db.getProjectById(component.projectId);
  if (!project) {
    res.status(404).json({ error: 'Associated project not found' });
    return;
  }

  // Access control
  if (!project.isPublic && (!req.user || project.ownerId !== req.user.id)) {
    res.status(403).json({ error: 'Access denied to this component' });
    return;
  }

  res.json({ component });
});

// Add a component to a project
router.post('/projects/:projectId/components', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const project = await db.getProjectById(req.params.projectId as string);
  const userId = req.user!.id;

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (project.ownerId !== userId) {
    res.status(403).json({ error: 'You are not authorized to add components to this project' });
    return;
  }

  const { name, description, code, props } = req.body;

  if (!name || !code) {
    res.status(400).json({ error: 'Component name and code are required' });
    return;
  }

  // Parse props from code automatically, or merge/use user-submitted ones if provided
  let finalProps = props;
  if (!finalProps || !Array.isArray(finalProps)) {
    finalProps = parsePropsFromCode(code);
  }

  const newComponent: Component = {
    id: crypto.randomUUID(),
    projectId: req.params.projectId as string,
    name,
    description: description || '',
    code,
    props: finalProps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.addComponent(newComponent);
  res.status(201).json({ component: newComponent });
});

// Update a component
router.put('/components/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const component = await db.getComponentById(req.params.id as string);
  const userId = req.user!.id;

  if (!component) {
    res.status(404).json({ error: 'Component not found' });
    return;
  }

  const project = await db.getProjectById(component.projectId);
  if (!project || project.ownerId !== userId) {
    res.status(403).json({ error: 'You are not authorized to update this component' });
    return;
  }

  const { name, description, code, props, autoParse } = req.body;

  let finalProps = props;
  
  if (code && (autoParse || !props)) {
    finalProps = parsePropsFromCode(code);
  }

  const updated = await db.updateComponent(req.params.id as string, {
    name: name !== undefined ? name : component.name,
    description: description !== undefined ? description : component.description,
    code: code !== undefined ? code : component.code,
    props: finalProps !== undefined ? finalProps : component.props
  });

  res.json({ component: updated });
});

// Delete a component
router.delete('/components/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const component = await db.getComponentById(req.params.id as string);
  const userId = req.user!.id;

  if (!component) {
    res.status(404).json({ error: 'Component not found' });
    return;
  }

  const project = await db.getProjectById(component.projectId);
  if (!project || project.ownerId !== userId) {
    res.status(403).json({ error: 'You are not authorized to delete this component' });
    return;
  }

  await db.deleteComponent(req.params.id as string);
  res.json({ message: 'Component deleted successfully' });
});

export default router;
