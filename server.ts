import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  classifyMimeType,
  isShareExpired,
  validateEmail,
  validateProjectInput,
} from './src/utils/vaultLogic';
import type {
  ActivityItem,
  Project,
  ShareLink,
  UserProfile,
  VaultFile,
} from './src/types/vault';

interface StoredUser extends UserProfile {
  passwordHash: string;
}

interface StoredShare extends ShareLink {
  passwordHash: string | null;
}

interface StoredFile extends VaultFile {
  storagePath: string | null;
  inlineAssetPath: string | null;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: Record<string, string>; // token -> userId
  projects: Project[];
  files: StoredFile[];
  shares: StoredShare[];
  activity: Record<string, ActivityItem[]>;
  contacts: ContactMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'clientvault-db.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function createSeedDatabase(): DatabaseSchema {
  const now = Date.now();
  const iso = (offsetHours: number) => new Date(now + offsetHours * 3600 * 1000).toISOString();

  const demoUser: StoredUser = {
    id: 'user-demo-1',
    name: 'RAKIB',
    email: 'rakib@clientvault.studio',
    role: 'Founder & Creative Lead',
    avatarInitials: 'RK',
    isDemo: true,
    passwordHash: hashSecret('oceanic2026'),
    settings: {
      workspaceName: "RAKIB's ClientVault",
      brandAccent: 'cyan',
      defaultShareExpiry: '7d',
      requirePasswordByDefault: true,
      emailNotifications: true,
      twoFactorEnabled: true,
      storageQuotaBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    },
  };

  const projects: Project[] = [
    {
      id: 'proj-aether',
      ownerId: demoUser.id,
      name: 'Aether Skincare Launch',
      clientName: 'Aether Botanicals',
      clientEmail: 'launch@aetherbotanicals.com',
      description: 'Complete bottle packaging renders, brand guidelines PDF, and launch campaign assets.',
      status: 'active',
      accentColor: 'cyan',
      createdAt: iso(-120),
      updatedAt: iso(-2),
    },
    {
      id: 'proj-pelagic',
      ownerId: demoUser.id,
      name: 'Pelagic Yachts Digital',
      clientName: 'Pelagic Marine Group',
      clientEmail: 'marketing@pelagicmarine.io',
      description: 'Interactive 3D fleet showcase, UI component library, and technical brochures.',
      status: 'review',
      accentColor: 'turquoise',
      createdAt: iso(-240),
      updatedAt: iso(-14),
    },
    {
      id: 'proj-lumina',
      ownerId: demoUser.id,
      name: 'Lumina Fintech Rebrand',
      clientName: 'Lumina Capital',
      clientEmail: 'design@luminacapital.co',
      description: 'Executive deck templates, icon pack, and production motion bumpers.',
      status: 'delivered',
      accentColor: 'purple',
      createdAt: iso(-480),
      updatedAt: iso(-48),
    },
  ];

  const files: StoredFile[] = [
    {
      id: 'file-aether-mockup',
      ownerId: demoUser.id,
      projectId: 'proj-aether',
      name: 'Aether-Packaging-Hero-4K.jpg',
      mimeType: 'image/jpeg',
      size: 4820400,
      category: 'image',
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      description: 'Studio hero photograph of frosted glass serum bottle and foil brand dossier.',
      previewUrl: '/src/assets/images/creative_deliverable_preview_1794641035657.jpg',
      inlineAssetPath: path.resolve(process.cwd(), 'src/assets/images/creative_deliverable_preview_1794641035657.jpg'),
      storagePath: null,
      createdAt: iso(-18),
      updatedAt: iso(-2),
    },
    {
      id: 'file-aether-spec',
      ownerId: demoUser.id,
      projectId: 'proj-aether',
      name: 'Aether-Brand-Guidelines-v3.md',
      mimeType: 'text/markdown',
      size: 24800,
      category: 'document',
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      description: 'Typography scale, deep slate & cyan foil color tokens, and print tolerances.',
      previewUrl: null,
      textPreview: `# Aether Botanicals — Brand Identity Specification\n\n## Color System\n- Deep Slate: #111927\n- Frosted Aqua: #7FE7F2\n- Matte Charcoal Foil: #0B1220\n\n## Typography\n- Display: Plus Jakarta Sans Bold\n- Editorial Copy: Manrope Regular\n\n## Packaging Print Notes\n1. Use 350gsm uncoated cotton stock for primary folder.\n2. Cyan metallic foil stamp at 0.4pt minimum stroke weight.\n3. Deliver final print-ready PDF/X-4 plates by Friday.`,
      inlineAssetPath: null,
      storagePath: null,
      createdAt: iso(-26),
      updatedAt: iso(-4),
    },
    {
      id: 'file-pelagic-tokens',
      ownerId: demoUser.id,
      projectId: 'proj-pelagic',
      name: 'Pelagic-Design-Tokens.json',
      mimeType: 'application/json',
      size: 18420,
      category: 'design',
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      description: 'Production Figma design tokens exported for web & mobile yacht configurator.',
      previewUrl: null,
      textPreview: JSON.stringify(
        {
          brand: 'Pelagic Marine',
          surface: { deepOcean: '#03152F', glassPanel: 'rgba(255,255,255,0.12)' },
          accent: { cyan: '#00D9FF', turquoise: '#22E6D0' },
          radii: { card: '24px', control: '12px' },
        },
        null,
        2
      ),
      inlineAssetPath: null,
      storagePath: null,
      createdAt: iso(-42),
      updatedAt: iso(-14),
    },
    {
      id: 'file-pelagic-turtle',
      ownerId: demoUser.id,
      projectId: 'proj-pelagic',
      name: 'Marine-Conservation-Campaign-Still.jpg',
      mimeType: 'image/jpeg',
      size: 6150200,
      category: 'image',
      isFavorite: true,
      isTrashed: false,
      trashedAt: null,
      description: 'Key visual underwater artwork for Pelagic Reef Sanctuary partnership.',
      previewUrl: '/src/assets/images/hero_turtle_ocean_1794641035043.jpg',
      inlineAssetPath: path.resolve(process.cwd(), 'src/assets/images/hero_turtle_ocean_1794641035043.jpg'),
      storagePath: null,
      createdAt: iso(-60),
      updatedAt: iso(-16),
    },
    {
      id: 'file-lumina-archive',
      ownerId: demoUser.id,
      projectId: 'proj-lumina',
      name: 'Lumina-Vector-Assets-Bundle.zip',
      mimeType: 'application/zip',
      size: 42500000,
      category: 'archive',
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      description: 'Final approved SVG logos, favicon suite, and social media banners.',
      previewUrl: null,
      textPreview: null,
      inlineAssetPath: null,
      storagePath: null,
      createdAt: iso(-96),
      updatedAt: iso(-48),
    },
    {
      id: 'file-trashed-draft',
      ownerId: demoUser.id,
      projectId: 'proj-aether',
      name: 'Aether-Packaging-Draft-v1.txt',
      mimeType: 'text/plain',
      size: 4200,
      category: 'document',
      isFavorite: false,
      isTrashed: true,
      trashedAt: iso(-10),
      description: 'Superseded packaging copy notes from initial kickoff.',
      previewUrl: null,
      textPreview: 'Initial exploratory notes replaced by v3 brand dossier.',
      inlineAssetPath: null,
      storagePath: null,
      createdAt: iso(-110),
      updatedAt: iso(-10),
    },
  ];

  const shares: StoredShare[] = [
    {
      id: 'share-aether-live',
      token: 'aether-launch-2026',
      ownerId: demoUser.id,
      title: 'Aether Skincare — Final Launch Deliverables',
      targetType: 'project',
      targetId: 'proj-aether',
      clientEmail: 'launch@aetherbotanicals.com',
      hasPassword: false,
      passwordHash: null,
      expiresAt: iso(24 * 14),
      allowDownload: true,
      isRevoked: false,
      viewsCount: 28,
      downloadsCount: 14,
      createdAt: iso(-16),
    },
    {
      id: 'share-pelagic-locked',
      token: 'pelagic-review-vault',
      ownerId: demoUser.id,
      title: 'Pelagic Marine — Confidential Review Pack',
      targetType: 'project',
      targetId: 'proj-pelagic',
      clientEmail: 'marketing@pelagicmarine.io',
      hasPassword: true,
      passwordHash: hashSecret('reef2026'),
      passwordHint: 'Demo password: reef2026',
      expiresAt: iso(24 * 7),
      allowDownload: true,
      isRevoked: false,
      viewsCount: 9,
      downloadsCount: 3,
      createdAt: iso(-8),
    },
  ];

  const activity: Record<string, ActivityItem[]> = {
    [demoUser.id]: [
      {
        id: 'act-1',
        action: 'Shared project portal',
        subject: 'Aether Skincare — Final Launch Deliverables',
        timestamp: iso(-2),
        tone: 'cyan',
      },
      {
        id: 'act-2',
        action: 'Uploaded 4K asset',
        subject: 'Aether-Packaging-Hero-4K.jpg',
        timestamp: iso(-4),
        tone: 'turquoise',
      },
      {
        id: 'act-3',
        action: 'Enabled password lock',
        subject: 'Pelagic Marine — Confidential Review Pack',
        timestamp: iso(-8),
        tone: 'purple',
      },
    ],
  };

  return {
    users: [demoUser],
    sessions: {
      'demo-session-token': demoUser.id,
    },
    projects,
    files,
    shares,
    activity,
    contacts: [],
  };
}

function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      const demo = parsed.users?.find((u) => u.id === 'user-demo-1');
      if (
        demo &&
        (demo.name === 'Elena Vance' ||
          demo.email === 'elena@oceanicstudio.co' ||
          demo.settings?.workspaceName === 'Oceanic Design Studio')
      ) {
        demo.name = 'RAKIB';
        demo.email = 'rakib@clientvault.studio';
        demo.role = 'Founder & Creative Lead';
        demo.avatarInitials = 'RK';
        demo.settings = {
          ...demo.settings,
          workspaceName: "RAKIB's ClientVault",
        };
        saveDb(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load DB, recreating seed:', err);
  }
  const seed = createSeedDatabase();
  saveDb(seed);
  return seed;
}

function saveDb(db: DatabaseSchema): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

const db = loadDb();

function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
}

function sanitizeShare(share: StoredShare): ShareLink {
  const { passwordHash: _ignored, ...rest } = share;
  return rest;
}

function sanitizeFile(file: StoredFile): VaultFile {
  const { storagePath: _s, inlineAssetPath: _i, ...rest } = file;
  return {
    ...rest,
    previewUrl:
      file.storagePath || file.inlineAssetPath
        ? `/api/files/${file.id}/content`
        : rest.previewUrl,
  };
}

function getAuthUser(req: express.Request): StoredUser | null {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerToken = (req.headers['x-vault-token'] as string | undefined) || '';
  const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
  const token = bearerToken || headerToken || queryToken;
  if (!token) return null;
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) || null;
}

function pushActivity(userId: string, action: string, subject: string, tone: ActivityItem['tone'] = 'cyan') {
  if (!db.activity[userId]) db.activity[userId] = [];
  db.activity[userId].unshift({
    id: `act-${crypto.randomUUID().slice(0, 8)}`,
    action,
    subject,
    timestamp: new Date().toISOString(),
    tone,
  });
  db.activity[userId] = db.activity[userId].slice(0, 20);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'ClientVault' });
  });

  // Auth routes
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, workspaceName } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      return;
    }
    if (!email || !validateEmail(String(email))) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const userId = `user-${crypto.randomUUID().slice(0, 10)}`;
    const cleanName = String(name).trim();
    const newUser: StoredUser = {
      id: userId,
      name: cleanName,
      email: normalizedEmail,
      role: 'Workspace Owner',
      avatarInitials: makeInitials(cleanName),
      passwordHash: hashSecret(String(password)),
      settings: {
        workspaceName: String(workspaceName || `${cleanName.split(' ')[0]}'s Vault`).trim(),
        brandAccent: 'cyan',
        defaultShareExpiry: '7d',
        requirePasswordByDefault: false,
        emailNotifications: true,
        twoFactorEnabled: false,
        storageQuotaBytes: 25 * 1024 * 1024 * 1024,
      },
    };

    // Starter welcome project so new accounts aren't bare
    const welcomeProject: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      ownerId: userId,
      name: 'Client Onboarding Kit',
      clientName: 'First Client',
      clientEmail: '',
      description: 'Your first secure client workspace. Upload files and generate a protected portal link.',
      status: 'active',
      accentColor: 'cyan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.projects.push(welcomeProject);
    pushActivity(userId, 'Created ClientVault workspace', newUser.settings.workspaceName, 'cyan');
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = userId;
    saveDb(db);

    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || user.passwordHash !== hashSecret(String(password))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = user.id;
    saveDb(db);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/demo', (_req, res) => {
    const demoUser = db.users[0];
    const token = 'demo-session-token';
    db.sessions[token] = demoUser.id;
    saveDb(db);
    res.json({ token, user: sanitizeUser(demoUser) });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  });

  // Vault state
  app.get('/api/vault', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json({
      user: sanitizeUser(user),
      projects: db.projects.filter((p) => p.ownerId === user.id),
      files: db.files.filter((f) => f.ownerId === user.id).map(sanitizeFile),
      shares: db.shares.filter((s) => s.ownerId === user.id).map(sanitizeShare),
      activity: db.activity[user.id] || [],
    });
  });

  // Settings
  app.patch('/api/settings', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { name, role, settings } = req.body || {};
    if (typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
      user.avatarInitials = makeInitials(user.name);
    }
    if (typeof role === 'string' && role.trim().length > 0) {
      user.role = role.trim();
    }
    if (settings && typeof settings === 'object') {
      user.settings = {
        ...user.settings,
        ...settings,
        storageQuotaBytes: user.settings.storageQuotaBytes,
      };
    }
    pushActivity(user.id, 'Updated workspace settings', user.settings.workspaceName, 'turquoise');
    saveDb(db);
    res.json({ user: sanitizeUser(user) });
  });

  // Projects CRUD
  app.post('/api/projects', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { name, clientName, clientEmail, description, accentColor, status } = req.body || {};
    const validationError = validateProjectInput({
      name: String(name || ''),
      clientName: String(clientName || ''),
      clientEmail: clientEmail ? String(clientEmail) : '',
    });
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const nowIso = new Date().toISOString();
    const project: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      ownerId: user.id,
      name: String(name).trim(),
      clientName: String(clientName).trim(),
      clientEmail: String(clientEmail || '').trim(),
      description: String(description || '').trim(),
      status: status || 'active',
      accentColor: accentColor || 'cyan',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.projects.unshift(project);
    pushActivity(user.id, 'Created project', project.name, 'cyan');
    saveDb(db);
    res.status(201).json({ project });
  });

  app.patch('/api/projects/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const project = db.projects.find((p) => p.id === req.params.id && p.ownerId === user.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const { name, clientName, clientEmail, description, status, accentColor } = req.body || {};
    if (typeof name === 'string' && name.trim().length >= 2) project.name = name.trim();
    if (typeof clientName === 'string' && clientName.trim().length >= 2) project.clientName = clientName.trim();
    if (typeof clientEmail === 'string') project.clientEmail = clientEmail.trim();
    if (typeof description === 'string') project.description = description.trim();
    if (status) project.status = status;
    if (accentColor) project.accentColor = accentColor;
    project.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ project });
  });

  app.delete('/api/projects/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const idx = db.projects.findIndex((p) => p.id === req.params.id && p.ownerId === user.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const [removed] = db.projects.splice(idx, 1);
    // Detach files into unassigned rather than losing them
    for (const file of db.files) {
      if (file.projectId === removed.id && file.ownerId === user.id) {
        file.projectId = null;
      }
    }
    pushActivity(user.id, 'Removed project', removed.name, 'purple');
    saveDb(db);
    res.json({ ok: true });
  });

  // Files CRUD + Upload + Content serving
  app.post('/api/files', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { name, mimeType, size, projectId, description, contentBase64, textPreview } = req.body || {};
    if (!name || String(name).trim().length === 0) {
      res.status(400).json({ error: 'File name is required.' });
      return;
    }
    const cleanName = path.basename(String(name).trim());
    const fileId = `file-${crypto.randomUUID().slice(0, 10)}`;
    const safeMime = String(mimeType || 'application/octet-stream');
    let storagePath: string | null = null;
    let computedSize = Number(size) || 0;
    let extractedText: string | null = typeof textPreview === 'string' ? textPreview : null;

    if (typeof contentBase64 === 'string' && contentBase64.length > 0) {
      const base64Body = contentBase64.includes(',') ? contentBase64.split(',')[1] : contentBase64;
      const buffer = Buffer.from(base64Body, 'base64');
      computedSize = buffer.byteLength;
      const storedFilename = `${fileId}-${cleanName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      storagePath = path.join(UPLOADS_DIR, storedFilename);
      fs.writeFileSync(storagePath, buffer);

      if (
        !extractedText &&
        (safeMime.startsWith('text/') ||
          safeMime.includes('json') ||
          /\.(md|txt|csv|json|svg|ts|tsx|css|html)$/i.test(cleanName))
      ) {
        extractedText = buffer.toString('utf8').slice(0, 16000);
      }
    }

    const nowIso = new Date().toISOString();
    const category = classifyMimeType(safeMime, cleanName);
    const storedFile: StoredFile = {
      id: fileId,
      ownerId: user.id,
      projectId: projectId || null,
      name: cleanName,
      mimeType: safeMime,
      size: Math.max(computedSize, 128),
      category,
      isFavorite: false,
      isTrashed: false,
      trashedAt: null,
      description: String(description || 'Client deliverable uploaded to ClientVault.').trim(),
      previewUrl: storagePath ? `/api/files/${fileId}/content` : null,
      textPreview: extractedText,
      storagePath,
      inlineAssetPath: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.files.unshift(storedFile);
    pushActivity(user.id, 'Uploaded file', storedFile.name, 'turquoise');
    saveDb(db);
    res.status(201).json({ file: sanitizeFile(storedFile) });
  });

  app.patch('/api/files/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const file = db.files.find((f) => f.id === req.params.id && f.ownerId === user.id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    const { isFavorite, isTrashed, name, projectId, description } = req.body || {};
    if (typeof isFavorite === 'boolean') file.isFavorite = isFavorite;
    if (typeof isTrashed === 'boolean') {
      file.isTrashed = isTrashed;
      file.trashedAt = isTrashed ? new Date().toISOString() : null;
      pushActivity(
        user.id,
        isTrashed ? 'Moved to trash' : 'Restored from trash',
        file.name,
        isTrashed ? 'purple' : 'cyan'
      );
    }
    if (typeof name === 'string' && name.trim().length > 0) {
      file.name = name.trim();
      file.category = classifyMimeType(file.mimeType, file.name);
    }
    if (projectId !== undefined) file.projectId = projectId || null;
    if (typeof description === 'string') file.description = description.trim();
    file.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ file: sanitizeFile(file) });
  });

  app.delete('/api/files/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const idx = db.files.findIndex((f) => f.id === req.params.id && f.ownerId === user.id);
    if (idx === -1) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    const [removed] = db.files.splice(idx, 1);
    if (removed.storagePath && fs.existsSync(removed.storagePath)) {
      try {
        fs.unlinkSync(removed.storagePath);
      } catch {
        // ignore cleanup error
      }
    }
    pushActivity(user.id, 'Permanently deleted', removed.name, 'purple');
    saveDb(db);
    res.json({ ok: true });
  });

  function sendStoredFile(res: express.Response, file: StoredFile, forceDownload: boolean) {
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    if (forceDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/"/g, '')}"`);
    }
    const diskPath = file.storagePath || file.inlineAssetPath;
    if (diskPath && fs.existsSync(diskPath)) {
      res.sendFile(diskPath);
      return;
    }
    const fallbackBody =
      file.textPreview ||
      `ClientVault Secure Deliverable\nFile: ${file.name}\nType: ${file.mimeType}\nDescription: ${file.description}\n`;
    res.send(Buffer.from(fallbackBody, 'utf8'));
  }

  app.get('/api/files/:id/content', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const file = db.files.find((f) => f.id === req.params.id && f.ownerId === user.id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    sendStoredFile(res, file, req.query.download === '1');
  });

  // Share Links CRUD
  app.post('/api/shares', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { title, targetType, targetId, clientEmail, password, expiresAt, allowDownload } = req.body || {};
    if (!targetType || !targetId) {
      res.status(400).json({ error: 'Target file or project is required.' });
      return;
    }
    const cleanPassword = typeof password === 'string' && password.trim().length > 0 ? password.trim() : null;
    const slug = crypto.randomBytes(5).toString('hex');
    const share: StoredShare = {
      id: `share-${crypto.randomUUID().slice(0, 8)}`,
      token: `${targetType === 'project' ? 'portal' : 'file'}-${slug}`,
      ownerId: user.id,
      title: String(title || 'Client Deliverable Link').trim(),
      targetType: targetType === 'project' ? 'project' : 'file',
      targetId: String(targetId),
      clientEmail: String(clientEmail || '').trim(),
      hasPassword: Boolean(cleanPassword),
      passwordHash: cleanPassword ? hashSecret(cleanPassword) : null,
      expiresAt: expiresAt || null,
      allowDownload: allowDownload !== false,
      isRevoked: false,
      viewsCount: 0,
      downloadsCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.shares.unshift(share);
    pushActivity(user.id, 'Created secure share link', share.title, 'cyan');
    saveDb(db);
    res.status(201).json({ share: sanitizeShare(share) });
  });

  app.patch('/api/shares/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const share = db.shares.find((s) => s.id === req.params.id && s.ownerId === user.id);
    if (!share) {
      res.status(404).json({ error: 'Share link not found' });
      return;
    }
    const { title, isRevoked, allowDownload, expiresAt, password } = req.body || {};
    if (typeof title === 'string' && title.trim().length > 0) share.title = title.trim();
    if (typeof isRevoked === 'boolean') share.isRevoked = isRevoked;
    if (typeof allowDownload === 'boolean') share.allowDownload = allowDownload;
    if (expiresAt !== undefined) share.expiresAt = expiresAt;
    if (typeof password === 'string') {
      if (password.trim().length > 0) {
        share.hasPassword = true;
        share.passwordHash = hashSecret(password.trim());
      } else {
        share.hasPassword = false;
        share.passwordHash = null;
      }
    }
    saveDb(db);
    res.json({ share: sanitizeShare(share) });
  });

  app.delete('/api/shares/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const idx = db.shares.findIndex((s) => s.id === req.params.id && s.ownerId === user.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Share link not found' });
      return;
    }
    const [removed] = db.shares.splice(idx, 1);
    pushActivity(user.id, 'Deleted share link', removed.title, 'purple');
    saveDb(db);
    res.json({ ok: true });
  });

  function resolveSharePayload(share: StoredShare, unlocked: boolean) {
    const owner = db.users.find((u) => u.id === share.ownerId);
    const expired = isShareExpired(share.expiresAt);
    const canReveal = unlocked && !expired && !share.isRevoked;

    let project: Project | null = null;
    let files: StoredFile[] = [];

    if (canReveal) {
      if (share.targetType === 'project') {
        project = db.projects.find((p) => p.id === share.targetId) || null;
        files = db.files.filter((f) => f.projectId === share.targetId && !f.isTrashed);
      } else {
        const single = db.files.find((f) => f.id === share.targetId && !f.isTrashed);
        if (single) {
          files = [single];
          if (single.projectId) {
            project = db.projects.find((p) => p.id === single.projectId) || null;
          }
        }
      }
    }

    return {
      share: {
        id: share.id,
        token: share.token,
        title: share.title,
        targetType: share.targetType,
        hasPassword: share.hasPassword,
        passwordHint: share.passwordHint,
        expiresAt: share.expiresAt,
        allowDownload: share.allowDownload,
        isRevoked: share.isRevoked,
        isExpired: expired,
        viewsCount: share.viewsCount,
        downloadsCount: share.downloadsCount,
        workspaceName: owner?.settings.workspaceName || 'ClientVault Studio',
      },
      unlocked: canReveal,
      project: project
        ? {
            id: project.id,
            name: project.name,
            clientName: project.clientName,
            description: project.description,
            status: project.status,
          }
        : null,
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        category: f.category,
        description: f.description,
        previewUrl:
          f.previewUrl &&
          !f.previewUrl.startsWith('/api/files/') &&
          !f.previewUrl.startsWith('/src/')
            ? f.previewUrl
            : `/api/portal/${share.token}/files/${f.id}/download?inline=1`,
        textPreview: f.textPreview,
        createdAt: f.createdAt,
      })),
    };
  }

  // Public Client Portal endpoints
  app.get('/api/portal/:token', (req, res) => {
    const share = db.shares.find((s) => s.token === req.params.token);
    if (!share) {
      res.status(404).json({ error: 'This client portal link does not exist or has been removed.' });
      return;
    }
    share.viewsCount += 1;
    saveDb(db);
    res.json(resolveSharePayload(share, !share.hasPassword));
  });

  app.post('/api/portal/:token/unlock', (req, res) => {
    const share = db.shares.find((s) => s.token === req.params.token);
    if (!share) {
      res.status(404).json({ error: 'Portal link not found.' });
      return;
    }
    if (share.isRevoked) {
      res.status(403).json({ error: 'This share link has been revoked by the owner.' });
      return;
    }
    if (isShareExpired(share.expiresAt)) {
      res.status(410).json({ error: 'This share link has expired.' });
      return;
    }
    const { password } = req.body || {};
    if (share.hasPassword) {
      if (!password || hashSecret(String(password)) !== share.passwordHash) {
        res.status(401).json({ error: 'Incorrect password. Please try again.' });
        return;
      }
    }
    res.json(resolveSharePayload(share, true));
  });

  app.get('/api/portal/:token/files/:fileId/download', (req, res) => {
    const share = db.shares.find((s) => s.token === req.params.token);
    if (!share || share.isRevoked || isShareExpired(share.expiresAt)) {
      res.status(403).json({ error: 'Link is no longer active.' });
      return;
    }
    const isInline = req.query.inline === '1';
    if (!isInline && !share.allowDownload) {
      res.status(403).json({ error: 'Downloads are disabled for this link.' });
      return;
    }
    const file = db.files.find((f) => f.id === req.params.fileId && !f.isTrashed);
    if (!file) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }
    const belongs =
      (share.targetType === 'file' && share.targetId === file.id) ||
      (share.targetType === 'project' && file.projectId === share.targetId);
    if (!belongs) {
      res.status(403).json({ error: 'File is not part of this portal.' });
      return;
    }
    if (!isInline) {
      share.downloadsCount += 1;
      saveDb(db);
    }
    sendStoredFile(res, file, !isInline);
  });

  // Landing contact form
  app.post('/api/contact', (req, res) => {
    const { name, email, company, message } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      res.status(400).json({ error: 'Please provide your name.' });
      return;
    }
    if (!email || !validateEmail(String(email))) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!message || String(message).trim().length < 8) {
      res.status(400).json({ error: 'Please share a brief message (at least 8 characters).' });
      return;
    }
    const entry: ContactMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: String(email).trim(),
      company: String(company || '').trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    };
    db.contacts.push(entry);
    saveDb(db);
    res.status(201).json({ ok: true, id: entry.id });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClientVault server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ClientVault server:', err);
  process.exit(1);
});
