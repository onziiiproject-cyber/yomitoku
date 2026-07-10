-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "inviteCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "CompanyTag" (
    "companyId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("companyId", "tagId"),
    CONSTRAINT "CompanyTag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "followedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unfollowedAt" DATETIME,
    CONSTRAINT "LineRecipient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- CreateTable
CREATE TABLE "MessageBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MessageSend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageBatchId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "lineRecipientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lineResponseId" TEXT,
    "sentAt" DATETIME,
    "error" TEXT,
    CONSTRAINT "MessageSend_messageBatchId_fkey" FOREIGN KEY ("messageBatchId") REFERENCES "MessageBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageSend_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageSend_lineRecipientId_fkey" FOREIGN KEY ("lineRecipientId") REFERENCES "LineRecipient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_stripeCustomerId_key" ON "Company"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_stripeSubscriptionId_key" ON "Company"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_inviteCode_key" ON "Company"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_key_key" ON "Tag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "LineRecipient_lineUserId_key" ON "LineRecipient"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_source_externalEventId_key" ON "WebhookEvent"("source", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageBatch_idempotencyKey_key" ON "MessageBatch"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "MessageSend_messageBatchId_lineRecipientId_key" ON "MessageSend"("messageBatchId", "lineRecipientId");
