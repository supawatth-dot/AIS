-- CreateTable Employee
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable Asset
CREATE TABLE "Asset"  (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "purchaseDate" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "warrantyExpiry" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL DEFAULT '',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable SIMContract
CREATE TABLE "SIMContract" (
    "phoneNumber" TEXT NOT NULL PRIMARY KEY,
    "carrier" TEXT NOT NULL DEFAULT 'AIS',
    "contractNumber" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "monthlyCost" REAL NOT NULL,
    "contractStartDate" TEXT NOT NULL,
    "contractEndDate" TEXT NOT NULL,
    "contractStatus" TEXT NOT NULL DEFAULT 'Active',
    "aisAccountName" TEXT NOT NULL,
    "linkedAssetId" TEXT UNIQUE,
    "attachedDocId" TEXT UNIQUE,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("linkedAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("attachedDocId") REFERENCES "SystemDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable AssignmentHistory
CREATE TABLE "AssignmentHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "assignmentDate" TEXT NOT NULL,
    "returnDate" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable SystemDocument
CREATE TABLE "SystemDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileSize" INTEGER NOT NULL,
    "linkedType" TEXT NOT NULL,
    "linkedId" TEXT,
    "assetId" TEXT,
    FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable ActivityLog
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "user" TEXT NOT NULL DEFAULT 'admin'
);
