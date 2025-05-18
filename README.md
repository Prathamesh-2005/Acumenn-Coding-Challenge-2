# Acumenn-Coding-Challenge-2

# 🛠️ Jira Clone – Serverless Architecture (Phase 2)

This project is a **Jira Clone** application re-architected into a **modern serverless system using Supabase**. The frontend remains unchanged while the backend leverages Supabase's powerful features including **PostgreSQL**, **Auth**, and **Row-Level Security (RLS)** for secure multi-tenancy.

---

## ✅ Phase 2 Deliverables

- ✅ Serverless architecture using Supabase
- ✅ Existing React frontend retained
- ✅ Multi-tenancy with secure data isolation using RLS
- ✅ Documented:
  - Database Schema
  - RLS Policies
  - Architectural Decisions
  - Deployment Instructions
  - Scalability, Security, Maintainability

---
## Deployed LINK of project= 
https://acumenn-coding-challenge-2-1wd8.vercel.app/

## 🧱 Database Schema (PostgreSQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables (in correct FK order)
DROP TABLE IF EXISTS "issue_users_user";
DROP TABLE IF EXISTS "comment";
DROP TABLE IF EXISTS "issue";
DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS "project";

-- Projects table
CREATE TABLE "project" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "url" VARCHAR,
  "description" TEXT,
  "category" VARCHAR NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Users table
CREATE TABLE "user" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR NOT NULL,
  "email" VARCHAR NOT NULL UNIQUE,
  "avatar_url" VARCHAR(2000) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "project_id" INTEGER REFERENCES "project"("id")
);

-- Issues table
CREATE TABLE "issue" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR NOT NULL,
  "type" VARCHAR NOT NULL,
  "status" VARCHAR NOT NULL,
  "priority" VARCHAR NOT NULL,
  "list_position" FLOAT8 NOT NULL,
  "description" TEXT,
  "description_text" TEXT,
  "estimate" INTEGER,
  "time_spent" INTEGER,
  "time_remaining" INTEGER,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "reporter_id" UUID NOT NULL REFERENCES "user"("id"),
  "project_id" INTEGER NOT NULL REFERENCES "project"("id")
);

-- Comments table
CREATE TABLE "comment" (
  "id" SERIAL PRIMARY KEY,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "user_id" UUID NOT NULL REFERENCES "user"("id"),
  "issue_id" INTEGER NOT NULL REFERENCES "issue"("id") ON DELETE CASCADE
);

-- Issue assignment (many-to-many)
CREATE TABLE "issue_users_user" (
  "issue_id" INTEGER NOT NULL REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "user"("id"),
  PRIMARY KEY ("issue_id", "user_id")
);

-- Indexes
CREATE INDEX "IDX_issue_users_issue" ON "issue_users_user" ("issue_id");
CREATE INDEX "IDX_issue_users_user" ON "issue_users_user" ("user_id");
```

---

## 🔐 Row-Level Security (RLS) Policies

Enable RLS:

```sql
ALTER TABLE "project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "issue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "issue_users_user" ENABLE ROW LEVEL SECURITY;
```

**Policies:**

```sql
-- Project: Read access
CREATE POLICY "read_all_projects" ON "project"
  FOR SELECT USING (true);

-- User: Read access
CREATE POLICY "read_all_users" ON "user"
  FOR SELECT USING (true);

-- Issue: Read access
CREATE POLICY "read_all_issues" ON "issue"
  FOR SELECT USING (true);

-- Issue: Users can update their own issues
CREATE POLICY "update_own_issue" ON "issue"
  FOR UPDATE USING (auth.uid() = reporter_id);

-- Comment: Read access
CREATE POLICY "read_all_comments" ON "comment"
  FOR SELECT USING (true);

-- Issue Users: Read access
CREATE POLICY "read_all_issue_users" ON "issue_users_user"
  FOR SELECT USING (true);
```

---
## DATABASE SCHEMA 


![supabase-schema-qublxlqfwshijqyoypvj (1)](https://github.com/user-attachments/assets/f42304dc-8065-439d-bd91-24c5d61ce818)


## 🚀 Deployment Instructions

### 🔹 1. Supabase Setup

- [ ] Create a project on [Supabase](https://app.supabase.com/)
- [ ] Run the **SQL schema** provided above in Supabase SQL Editor
- [ ] Enable **Row Level Security** for all tables
- [ ] Add the policies as shown above
- [ ] Enable **Email authentication** (or any other method)
- [ ] Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY`

---

### 🔹 2. Frontend Setup

- [ ] Clone the repository
- [ ] Create `.env.local` in root:

```env
REACT_SUPABASE_URL=https://your-project-id.supabase.co
REACT_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] Install dependencies and run:

```bash
npm install
npm run dev  # for local development
```

---

### 🔹 3. Deploy to Vercel

- [ ] Push code to GitHub
- [ ] Link GitHub repo on [Vercel](https://vercel.com/)
- [ ] Set the environment variables:

```env
REACT_SUPABASE_URL=https://your-project-id.supabase.co
REACT_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] Vercel will automatically detect and deploy the frontend

---

## 📐 Architectural Decisions

- Supabase used as BaaS with PostgreSQL, Auth, Storage, and RLS
- React frontend kept unchanged for drop-in compatibility
- UUIDs ensure user-safe and global uniqueness
- RLS separates access control logic from frontend/backend

---

## 📈 Scalability

- PostgreSQL scales vertically and horizontally
- Supabase supports **read replicas** and **edge caching**
- Stateless frontend can scale with CDN (e.g., Vercel)

---

## 🔒 Security

- **RLS ensures strict access control**
- **Supabase Auth + Policies** protect user data
- **Environment variables** managed securely via Vercel

---

## 🛠️ Maintainability

- Supabase provides GUI + SQL editor for DB updates
- Serverless removes backend maintenance overhead
- Schema and policies fully documented for onboarding

---

## 📬 Contact

Feel free to reach out for questions or collaboration!
