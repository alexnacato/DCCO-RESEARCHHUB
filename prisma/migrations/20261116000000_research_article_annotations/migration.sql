CREATE TABLE "ResearchArticleAnnotation" (
  "articleKey" TEXT NOT NULL,
  "researchLine" TEXT,
  "laboratory" TEXT,
  "updatedById" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResearchArticleAnnotation_pkey" PRIMARY KEY ("articleKey"),
  CONSTRAINT "ResearchArticleAnnotation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
