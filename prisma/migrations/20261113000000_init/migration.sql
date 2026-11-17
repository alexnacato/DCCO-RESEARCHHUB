CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'USER' CHECK ("role" IN ('ADMIN', 'USER')),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "Article" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "articleNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "doi" TEXT,
  "abstract" TEXT NOT NULL,
  "searchText" TEXT NOT NULL,
  "articleUrl" TEXT NOT NULL,
  "publicationYear" INTEGER NOT NULL CHECK ("publicationYear" BETWEEN 1900 AND 2100),
  "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED')),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Article_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Article_articleNumber_key" ON "Article"("articleNumber");
CREATE UNIQUE INDEX "Article_doi_key" ON "Article"("doi");
CREATE INDEX "Article_status_createdAt_idx" ON "Article"("status", "createdAt");
CREATE INDEX "Article_createdById_status_idx" ON "Article"("createdById", "status");
CREATE TABLE "Classification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('LABORATORY', 'RESEARCH_LINE')),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "isActive" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "Classification_kind_code_key" ON "Classification"("kind", "code");
CREATE TABLE "Author" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fullName" TEXT NOT NULL
);
CREATE UNIQUE INDEX "Author_fullName_key" ON "Author"("fullName");
CREATE TABLE "ArticleAuthor" (
  "articleId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  PRIMARY KEY ("articleId", "authorId"),
  CONSTRAINT "ArticleAuthor_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ArticleAuthor_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ArticleClassification" (
  "articleId" TEXT NOT NULL,
  "classificationId" TEXT NOT NULL,
  PRIMARY KEY ("articleId", "classificationId"),
  CONSTRAINT "ArticleClassification_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ArticleClassification_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "Classification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ArticleClassification_classificationId_idx" ON "ArticleClassification"("classificationId");
CREATE TABLE "ArticleReview" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "articleId" TEXT NOT NULL,
  "reviewedById" TEXT NOT NULL,
  "decision" TEXT NOT NULL CHECK ("decision" IN ('APPROVED', 'REJECTED')),
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleReview_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ArticleReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ArticleReview_articleId_createdAt_idx" ON "ArticleReview"("articleId", "createdAt");
CREATE TABLE "LoginAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "ip" TEXT NOT NULL,
  "succeeded" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "LoginAttempt_email_ip_createdAt_idx" ON "LoginAttempt"("email", "ip", "createdAt");
CREATE TABLE "ArticleSequence" (
  "year" INTEGER NOT NULL PRIMARY KEY,
  "value" INTEGER NOT NULL DEFAULT 0
);
