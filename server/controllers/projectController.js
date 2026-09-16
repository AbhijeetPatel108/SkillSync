const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { getPagination, buildMeta } = require('../utils/helpers');

const PROJECT_STATUSES = ['open', 'in_progress', 'completed', 'archived'];

const normalizeSkills = (skills) => {
  if (skills === undefined) return undefined;
  if (!Array.isArray(skills)) throw new AppError('skills must be an array', 400);
  if (skills.length > 10) throw new AppError('A project can have at most 10 skills', 400);

  const seen = new Set();
  return skills.reduce((normalized, skill) => {
    if (typeof skill !== 'string' || !skill.trim()) {
      throw new AppError('Each project skill must be a non-empty string', 400);
    }
    const name = skill.trim();
    if (name.length > 50) throw new AppError('Project skill names cannot exceed 50 characters', 400);
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(name);
    }
    return normalized;
  }, []);
};

const validateProjectInput = (body, partial = false) => {
  const updates = {};
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw new AppError('Project title is required', 400);
    }
    const title = body.title.trim();
    if (title.length > 120) throw new AppError('Project title cannot exceed 120 characters', 400);
    updates.title = title;
  }

  if (!partial || body.description !== undefined) {
    const description = body.description === undefined ? '' : body.description;
    if (typeof description !== 'string') throw new AppError('Project description must be text', 400);
    if (description.trim().length > 2000) throw new AppError('Project description cannot exceed 2000 characters', 400);
    updates.description = description.trim();
  }

  if (body.status !== undefined) {
    if (!PROJECT_STATUSES.includes(body.status)) {
      throw new AppError(`Invalid project status. Valid values: ${PROJECT_STATUSES.join(', ')}`, 400);
    }
    updates.status = body.status;
  }

  const skills = normalizeSkills(body.skills);
  if (skills !== undefined) updates.skills = skills;
  return updates;
};

const loadSkills = async (projectIds) => {
  if (!projectIds.length) return new Map();
  const placeholders = projectIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT project_id, name FROM project_skills WHERE project_id IN (${placeholders}) ORDER BY project_id ASC, name ASC`,
    projectIds
  );
  const skillsByProject = new Map();
  for (const row of rows) {
    const skills = skillsByProject.get(Number(row.project_id)) || [];
    skills.push(row.name);
    skillsByProject.set(Number(row.project_id), skills);
  }
  return skillsByProject;
};

const mapProjects = async (rows) => {
  const skillsByProject = await loadSkills(rows.map((row) => Number(row.id)));
  return rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    description: row.description || '',
    status: row.status,
    skills: skillsByProject.get(Number(row.id)) || [],
    owner: {
      id: Number(row.owner_id),
      name: row.owner_name,
      avatar: row.owner_avatar || '',
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

const projectSelect = `
  SELECT p.id, p.owner_id, p.title, p.description, p.status, p.created_at, p.updated_at,
         u.name AS owner_name, u.avatar AS owner_avatar
  FROM projects p
  JOIN users u ON u.id = p.owner_id AND u.is_active = 1`;

const getProjects = async (req, res) => {
  const { search, status, ownerId } = req.query;
  if (status && !PROJECT_STATUSES.includes(status)) throw new AppError('Invalid project status', 400);
  const { page, limit, skip } = getPagination(req.query);
  const where = [];
  const params = [];

  if (search && search.trim()) {
    where.push('(p.title LIKE ? OR p.description LIKE ?)');
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  if (status) {
    where.push('p.status = ?');
    params.push(status);
  }
  if (ownerId) {
    where.push('p.owner_id = ?');
    params.push(ownerId);
  }

  const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM projects p JOIN users u ON u.id = p.owner_id AND u.is_active = 1${whereSql}`, params);
  const [rows] = await pool.execute(
    `${projectSelect}${whereSql} ORDER BY p.updated_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, skip]
  );

  res.status(200).json({
    success: true,
    meta: buildMeta(Number(countRows[0].total || 0), page, limit),
    projects: await mapProjects(rows),
  });
};

const getProjectById = async (req, res) => {
  const [rows] = await pool.execute(`${projectSelect} WHERE p.id = ? LIMIT 1`, [req.params.id]);
  if (!rows[0]) throw new AppError('Project not found', 404);
  const [project] = await mapProjects(rows);
  res.status(200).json({ success: true, project });
};

const createProject = async (req, res) => {
  const project = validateProjectInput(req.body);
  const [result] = await pool.execute(
    'INSERT INTO projects (owner_id, title, description, status) VALUES (?, ?, ?, ?)',
    [req.user.id, project.title, project.description, project.status || 'open']
  );

  if (project.skills?.length) {
    await pool.query(
      `INSERT INTO project_skills (project_id, name) VALUES ${project.skills.map(() => '(?, ?)').join(', ')}`,
      project.skills.flatMap((skill) => [result.insertId, skill])
    );
  }
  const [rows] = await pool.execute(`${projectSelect} WHERE p.id = ? LIMIT 1`, [result.insertId]);
  const [created] = await mapProjects(rows);
  res.status(201).json({ success: true, project: created });
};

const updateProject = async (req, res) => {
  const project = validateProjectInput(req.body, true);
  const [existingRows] = await pool.execute('SELECT id, owner_id FROM projects WHERE id = ? LIMIT 1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) throw new AppError('Project not found', 404);
  if (Number(existing.owner_id) !== Number(req.user.id)) throw new AppError('You can only update your own projects', 403);

  const fields = [];
  const values = [];
  for (const field of ['title', 'description', 'status']) {
    if (project[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(project[field]);
    }
  }
  if (!fields.length && project.skills === undefined) throw new AppError('Nothing to update', 400);
  if (fields.length) {
    values.push(req.params.id);
    await pool.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
  }
  if (project.skills !== undefined) {
    await pool.execute('DELETE FROM project_skills WHERE project_id = ?', [req.params.id]);
    if (project.skills.length) {
      await pool.query(
        `INSERT INTO project_skills (project_id, name) VALUES ${project.skills.map(() => '(?, ?)').join(', ')}`,
        project.skills.flatMap((skill) => [req.params.id, skill])
      );
    }
  }
  const [rows] = await pool.execute(`${projectSelect} WHERE p.id = ? LIMIT 1`, [req.params.id]);
  const [updated] = await mapProjects(rows);
  res.status(200).json({ success: true, project: updated });
};

const deleteProject = async (req, res) => {
  const [result] = await pool.execute('DELETE FROM projects WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) {
    const [rows] = await pool.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows[0]) throw new AppError('Project not found', 404);
    throw new AppError('You can only delete your own projects', 403);
  }
  res.status(200).json({ success: true, message: 'Project deleted successfully' });
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };