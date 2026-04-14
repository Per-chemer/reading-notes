const express = require("express");
const { z } = require("zod");
const pool = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

const createSchema = z.object({
  title: z.string().min(1),
  bookTitle: z.string().min(1),
  chapter: z.string().optional(),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  rating: z.number().int().min(0).max(5).default(0),
});

const updateSchema = createSchema.partial();

router.use(authRequired);

router.get("/", async (req, res) => {
  const keyword = String(req.query.keyword || "").trim();
  const values = [req.user.id];
  let whereSql = "WHERE user_id = $1";

  if (keyword) {
    values.push(`%${keyword}%`);
    whereSql += ` AND (title ILIKE $${values.length} OR book_title ILIKE $${values.length} OR content ILIKE $${values.length})`;
  }

  try {
    const result = await pool.query(
      `SELECT id, title, book_title AS "bookTitle", chapter, content, tags, rating, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM notes
       ${whereSql}
       ORDER BY updated_at DESC`,
      values,
    );
    return res.json({ notes: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch notes.", error: error.message });
  }
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid note payload." });
  }

  const { title, bookTitle, chapter, content, tags, rating } = parsed.data;

  try {
    const result = await pool.query(
      `INSERT INTO notes (user_id, title, book_title, chapter, content, tags, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, book_title AS "bookTitle", chapter, content, tags, rating, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [req.user.id, title, bookTitle, chapter ?? "", content, tags, rating],
    );
    return res.status(201).json({ note: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create note.", error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  const noteId = Number(req.params.id);
  if (!Number.isInteger(noteId) || noteId <= 0) {
    return res.status(400).json({ message: "Invalid note id." });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ message: "Invalid update payload." });
  }

  const data = parsed.data;
  const fields = [];
  const values = [req.user.id, noteId];

  const map = {
    title: "title",
    bookTitle: "book_title",
    chapter: "chapter",
    content: "content",
    tags: "tags",
    rating: "rating",
  };

  Object.keys(data).forEach((key) => {
    fields.push(`${map[key]} = $${values.length + 1}`);
    values.push(data[key]);
  });
  fields.push("updated_at = NOW()");

  try {
    const result = await pool.query(
      `UPDATE notes
       SET ${fields.join(", ")}
       WHERE user_id = $1 AND id = $2
       RETURNING id, title, book_title AS "bookTitle", chapter, content, tags, rating, created_at AS "createdAt", updated_at AS "updatedAt"`,
      values,
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Note not found." });
    }
    return res.json({ note: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update note.", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  const noteId = Number(req.params.id);
  if (!Number.isInteger(noteId) || noteId <= 0) {
    return res.status(400).json({ message: "Invalid note id." });
  }

  try {
    const result = await pool.query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [
      noteId,
      req.user.id,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Note not found." });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete note.", error: error.message });
  }
});

module.exports = router;
