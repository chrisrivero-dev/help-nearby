# AWS Architecture

> Multi-Project Deployment on AWS with ALB, EC2, and RDS
> Version: Universal | OIDC CI/CD | Single Developer

---

## AWS Deployment Guide Resources Table

| AWS Resource               | Resource Type | Description                                  | Variable                   | Value                                         |
| -------------------------- | ------------- | -------------------------------------------- | -------------------------- | --------------------------------------------- |
| IAM OIDC Identity Provider | IAM           | GitHub Actions OIDC identity provider        | -                          | `token.actions.githubusercontent.com`         |
| IAM Deployment Role        | IAM           | Role for GitHub Actions to assume            | `AWS_ROLE_ARN`             | `[FILL IN IAM ROLE ARN]`                      |
| AWS Account ID             | AWS           | Your 12-digit AWS account ID                 | `AWS_ACCOUNT_ID`           | `[12-DIGIT AWS ACCOUNT ID]`                   |
| EC2 Host (Elastic IP)      | EC2           | EC2 instance public IP for SSH/deployment    | `EC2_HOST`                 | `[EC2 ELASTIC IP]`                            |
| EC2 User                   | EC2           | SSH username for EC2                         | `EC2_USER`                 | `ubuntu`                                      |
| EC2 SSH Key                | EC2           | SSH private key (full PEM format)            | `EC2_SSH_KEY`              | `[YOUR SSH PRIVATE KEY]`                      |
| EC2 Security Group (ALB)   | EC2           | ALB security group - public internet traffic | `ALB_SECURITY_GROUP_ID`    | `[YOUR-ALB-SG-ID]`                            |
| EC2 Security Group (EC2)   | EC2           | EC2 security group - ALB and SSH access      | `EC2_SECURITY_GROUP_ID`    | `[YOUR-EC2-SG-ID]`                            |
| EC2 Security Group (RDS)   | EC2           | RDS security group - EC2 access only         | `RDS_SECURITY_GROUP_ID`    | `[YOUR-RDS-SG-ID]`                            |
| ECR Registry               | ECR           | Docker container registry                    | `ECR_REGISTRY`             | `[ACCOUNT-ID].dkr.ecr.[region].amazonaws.com` |
| ECR Backend Repository     | ECR           | Backend Docker image repository              | `ECR_BACKEND_REPO`         | `[project-name]-backend`                      |
| ECR Frontend Repository    | ECR           | Frontend Docker image repository             | `ECR_FRONTEND_REPO`        | `[project-name]-frontend`                     |
| ALB DNS Name               | ALB           | Application Load Balancer DNS                | `ALB_DNS_NAME`             | `[YOUR-ALB-DNS-NAME]`                         |
| ALB HTTPS Listener Port    | ALB           | HTTPS listener port                          | -                          | `443`                                         |
| ALB Backend Target Group   | ALB           | Backend service target group                 | `ALB_BACKEND_TG`           | `[project-name]-backend-tg`                   |
| ALB Frontend Target Group  | ALB           | Frontend service target group                | `ALB_FRONTEND_TG`          | `[project-name]-frontend-tg`                  |
| RDS Endpoint               | RDS           | PostgreSQL database endpoint                 | `RDS_ENDPOINT`             | `[YOUR-RDS-ENDPOINT]`                         |
| RDS Master Password        | RDS           | RDS master password                          | `RDS_PASSWORD`             | `[DATABASE PASSWORD]`                         |
| RDS Database Name          | RDS           | Main application database                    | `RDS_DB_NAME`              | `[DATABASE-NAME]`                             |
| RDS Database Pool Size     | RDS           | Database connection pool size                | `DATABASE_POOL_SIZE`       | `[DATABASE-POOL-SIZE]`                        |
| LOG_LEVEL                  | AWS           | Logging level (debug, info, etc.)            | `LOG_LEVEL`                | `[LOG-LEVEL]`                                 |
| TZ                         | AWS           | Timezone (e.g., America/New_York)            | `TZ`                       | `[TIMEZONE]`                                  |
| NEXT_PUBLIC_API_BASE_URL   | AWS           | Frontend API base URL                        | `NEXT_PUBLIC_API_BASE_URL` | `[YOUR-API-URL]`                              |
| Domain                     | DNS           | Main domain for your applications            | `DOMAIN`                   | `[YOUR-DOMAIN]`                               |
| ACM Certificate            | ACM           | Wildcard SSL certificate ARN                 | `ACM_CERT_ARN`             | `[CERTIFICATE ARN]`                           |
| VPC ID                     | VPC           | Your default VPC ID                          | `VPC_ID`                   | `[YOUR-VPC-ID]`                               |
| VPC CIDR                   | VPC           | VPC IP address range                         | `VPC_CIDR`                 | `[YOUR-VPC-CIDR]`                             |
| Region                     | AWS           | AWS region                                   | `AWS_REGION`               | `[AWS-REGION]`                                |

**Notes:**

- Values with `[FILL IN...]` are for you to configure
- Some values (like security group IDs, VPC ID) are created during setup
- Variable column shows GitHub Actions secret/environment variable names where applicable
- All AWS resources (EC2, RDS, ALB) must be in the same VPC
- Replace `[region]` in ECR registry with your chosen AWS region (e.g., `us-east-1`, `us-west-2`)

---

## Multi-App Architecture

This architecture supports multiple applications:

| Component              | Single App                            | Multiple Apps Example                          |
| ---------------------- | ------------------------------------- | ---------------------------------------------- |
| **EC2 Instance**       | 1 instance                            | 1 instance (shared)                            |
| **ECR Repositories**   | `project-backend`, `project-frontend` | `project2-frontend`, `project2-backend`, etc.  |
| **ALB Target Groups**  | 2 (frontend, backend)                 | +2 per additional app (ports 3001, 8001, etc.) |
| **ALB Listener Rules** | 2 rules                               | +2 rules per app (host-based routing)          |
| **RDS Databases**      | 1 database                            | `[database-1]`, `[database-2]`, etc.           |

**Traffic Flow:**

```
[your-domain].com          → ALB → EC2 :3000 (frontend)
[your-domain].com/api      → ALB → EC2 :8000 (backend)
project2.[your-domain].com → ALB → EC2 :3001 (frontend)
project2.[your-domain].com/api → ALB → EC2 :8001 (backend)
```

---

## Table of Contents

1. [IAM Setup](#1-iam-setup)
2. [Security Groups](#2-security-groups)
3. [RDS Database Setup](#3-rds-database-setup)
4. [EC2 Instance Setup](#4-ec2-instance-setup)
5. [ALB Configuration](#5-alb-configuration)
6. [Docker Configuration](#6-docker-configuration)
7. [GitHub Actions Pipeline](#7-github-actions-pipeline)
8. [DNS Configuration](#8-dns-configuration)
9. [First Deployment](#9-first-deployment)
   - [ECR Image Lifecycle Management](#91-ecr-image-lifecycle-management)
10. [Adding New Projects](#10-adding-new-projects)

---

## 1. IAM Setup

### 1.1 Create OIDC Identity Provider

```
IAM → Identity Providers → Add Provider
  Provider type: OpenID Connect
  Provider URL: https://token.actions.githubusercontent.com
  Audience: sts.amazonaws.com
```

### 1.2 Create Deployment Role (OIDC)

This IAM role allows GitHub Actions to assume temporary credentials using OIDC.

**Console Steps:**

1. Go to **IAM → Roles → Create Role**
2. **Trusted entity**: `Web Identity`
3. **Identity provider**: `token.actions.githubusercontent.com`
4. **Audience**: `sts.amazonaws.com`
5. **Condition** (optional but recommended):
   - `StringLike`: `repo:[your-org]/*:ref:refs/heads/main`
6. **Attach Policies**:
   - `AmazonEC2ContainerRegistryFullAccess` (for ECR push/pull)
   - `AmazonEC2FullAccess` (for EC2 management)
   - `AmazonRDSFullAccess` (for database access)
   - `AmazonS3FullAccess` (for S3 deployments - optional)
   - `CloudFrontFullAccess` (for CloudFront invalidation - optional)
7. **Name**: `[your-project-name]Deployer` (CamelCase)
8. Click **Create role**
9. **Copy the Role ARN** (you'll need it for GitHub secrets)

### 1.3 SSH Key Setup for EC2

When storing your SSH private key in GitHub Secrets for `appleboy/ssh-action`, the **full PEM format must be preserved**:

- **Header**: `---BEGIN RSA PRIVATE KEY---` or `---BEGIN OPENSSH PRIVATE KEY---`
- **Footer**: `---END RSA PRIVATE KEY---` or `---END OPENSSH PRIVATE KEY---`
- **No extra whitespace or line breaks**

**Error to watch for:**

- `ssh: no key found` - This means the header/footer are missing or the key is corrupted

**Create Key Pair in AWS Console (Recommended)**

1. Go to **EC2 Console → Network & Security → Key Pairs**
2. Click **Create Key Pair**
3. Name: `[project-name]-github-actions`
4. Key type: `RSA`
5. Click **Create key pair** (AWS downloads the private key)

**Add Private Key to GitHub Secrets:**

1. Open the `.pem` file and copy ALL contents (including header and footer)
2. Add as `EC2_SSH_KEY` secret in your GitHub repo

---

## 2. Security Groups

### 2.1 Create Security Groups

```
EC2 Console → Security Groups → Create Security Group
  Name: [project-name]-alb-sg
  Description: ALB - public internet traffic
  VPC: [YOUR-VPC-ID]
```

Repeat for `[project-name]-ec2-sg` and `[project-name]-rds-sg`.

### 2.2 Security Group Rules

**[project-name]-alb-sg:**

- HTTP (80) → 0.0.0.0/0 (Redirect to HTTPS)
- HTTPS (443) → 0.0.0.0/0

**[project-name]-ec2-sg:**

- Custom TCP (3000-3010) → Source: [project-name]-alb-sg
- Custom TCP (8000-8010) → Source: [project-name]-alb-sg
- SSH (22) → 0.0.0.0/0 (for GitHub Actions) or your IP

**[project-name]-rds-sg:**

- PostgreSQL (5432) → Source: [project-name]-ec2-sg

---

## 3. RDS Database Setup

### 3.1 Provision RDS Instance

```
RDS Console → Create database
  Engine: PostgreSQL
  Template: Free tier (or production)
  DB instance identifier: [project-name]-server
  Master username: [YOUR-USERNAME]
  Master password: [STRONG PASSWORD - save in manager]
  Instance class: db.t3.micro
  VPC: [YOUR-VPC-ID]
  Security Group: [project-name]-rds-sg
  Public access: Yes (temporary)
  Initial database name: [blank]
```

### 3.2 Create Databases and Users

After RDS is provisioned, connect and create databases:

```sql
-- Create main application database
CREATE DATABASE [database-name];

-- Create additional databases if needed
-- CREATE DATABASE [database-name-2];
-- CREATE DATABASE [database-name-3];

-- Create project user
CREATE USER [your-username] WITH PASSWORD '[strong-password]';
GRANT ALL PRIVILEGES ON DATABASE [database-name] TO [your-username];
-- GRANT ALL PRIVILEGES ON DATABASE [database-name-2] TO [your-username];
-- GRANT ALL PRIVILEGES ON DATABASE [database-name-3] TO [your-username];
```

---

## 4. EC2 Instance Setup

### 4.1 Launch Instance

```
EC2 Console → Instances → Launch Instances
  AMI: Ubuntu Server 26.04 LTS (or latest LTS)
  Instance type: t3.micro (or appropriate size)
  Key pair: [your-key-pair]
  Security Group: [project-name]-ec2-sg
  Storage: 20 GB gp2 (or appropriate size)
  Elastic IP: allocate and attach
```

### 4.2 Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4.3 Set Up EC2 Directory Structure

```bash
mkdir -p /home/ubuntu/apps/[project-name]
```

---

## 5. ALB Configuration

### 5.1 Provision ALB

```
EC2 Console → Load Balancers → Create Load Balancer
  Type: Application Load Balancer
  Scheme: internet-facing
  VPC: [YOUR-VPC-ID]
  Security Group: [project-name]-alb-sg
  Availability Zones: All zones in [AWS-REGION]
```

### 5.2 Configure HTTPS Listener

```
1. Create target groups:
   - [project-name]-frontend-tg (port 3000, health: /)
   - [project-name]-backend-tg (port 8000, health: /healthz)

2. Configure HTTPS listener (port 443):
   - SSL certificate: [ACM CERTIFICATE]
   - Default action: Fixed response 404

3. Add listener rules:
   - [your-domain].com → [project-name]-frontend-tg
   - [your-domain].com/api/* → [project-name]-backend-tg
```

---

## 6. Docker Configuration

### 6.1 Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# needed for better-sqlite3 native module compilation
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC_* vars must be present at build time
# These are set in .env files which are copied above, or via --build-arg
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-https://[your-domain]}

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Skip postinstall (rebuild-sqlite3) — we copy the pre-built binary from builder below
RUN npm install --omit=dev --ignore-scripts

# Copy pre-built native binary from builder (same Alpine platform, no recompile needed)
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### 6.2 Backend Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Install ALL dependencies (needed for build)
COPY package*.json ./
RUN npm install

# Copy source
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy pre-generated Prisma client from builder (avoids needing prisma CLI in production)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy Prisma CLI from builder (required for migrate deploy)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy built artifacts and schema from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port (AWS: 8000)
EXPOSE 8000

# Start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

### 6.3 Production docker-compose.yml

```yaml
services:
  backend:
    image: ${ECR_REGISTRY}/[project-name]-backend:${IMAGE_TAG}
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env.aws
    restart: always

  frontend:
    image: ${ECR_REGISTRY}/[project-name]-frontend:${IMAGE_TAG}
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env.aws
    restart: always
    depends_on:
      - backend

# RDS provisioned separately — no volumes needed
```

### 6.4 Environment Variables

**`.env.aws` files (on EC2 at `/home/ubuntu/apps/[project-name]/`):**

```bash
# Backend - backend/.env.aws
PORT=8000
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL=[postgresql-connection-string]
DATABASE_POOL_SIZE=[database-pool-size]
# Add additional database URLs if needed
# RXNORM_DB_URL=[postgresql-connection-string]
# UMLS_DB_URL=[postgresql-connection-string]
# SNOMEDCT_DB_URL=[postgresql-connection-string]
LOG_LEVEL=[log-level]
TZ=[timezone]
```

```bash
# Frontend - frontend/.env.aws
# Note: If using nginx to route /api/ to backend, include /api in the URL
# e.g., NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api
NEXT_PUBLIC_API_BASE_URL=https://[your-domain]
NODE_ENV=production
```

---

## 7. GitHub Actions Pipeline

### 7.1 Required Secrets

| Secret                     | Value                             |
| -------------------------- | --------------------------------- |
| `AWS_ROLE_ARN`             | ARN of OIDC IAM role              |
| `EC2_HOST`                 | EC2 Elastic IP                    |
| `EC2_SSH_KEY`              | SSH private key (PEM format)      |
| `DATABASE_URL`             | Database connection string        |
| `DATABASE_POOL_SIZE`       | Database pool size                |
| `RXNORM_DB_URL`            | RXNORM database URL (optional)    |
| `UMLS_DB_URL`              | UMLS database URL (optional)      |
| `SNOMEDCT_DB_URL`          | SNOMED CT database URL (optional) |
| `LOG_LEVEL`                | Logging level                     |
| `TZ`                       | Timezone                          |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API URL                  |

### 7.2 Pipeline YAML

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: [AWS-REGION]
  AWS_ACCOUNT_ID: ${{ secrets.AWS_ACCOUNT_ID }}
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.[AWS-REGION].amazonaws.com
  IMAGE_TAG: ${{ github.sha }}
  DOCKER_BUILDKIT: 1

jobs:
  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        run: |
          aws ecr get-login-password --region $AWS_REGION | \
            docker login --username AWS --password-stdin $ECR_REGISTRY

      - name: Build and push backend image
        run: |
          docker build \
            --platform linux/amd64 \
            -t $ECR_REGISTRY/[project-name]-backend:$IMAGE_TAG \
            ./backend
          docker push $ECR_REGISTRY/[project-name]-backend:$IMAGE_TAG
          docker tag $ECR_REGISTRY/[project-name]-backend:$IMAGE_TAG $ECR_REGISTRY/[project-name]-backend:latest
          docker push $ECR_REGISTRY/[project-name]-backend:latest

      - name: Build and push frontend image
        run: |
          docker build \
            --platform linux/amd64 \
            --build-arg NEXT_PUBLIC_API_BASE_URL=${{ secrets.NEXT_PUBLIC_API_BASE_URL }} \
            -t $ECR_REGISTRY/[project-name]-frontend:$IMAGE_TAG \
            ./frontend
          docker push $ECR_REGISTRY/[project-name]-frontend:$IMAGE_TAG
          docker tag $ECR_REGISTRY/[project-name]-frontend:$IMAGE_TAG $ECR_REGISTRY/[project-name]-frontend:latest
          docker push $ECR_REGISTRY/[project-name]-frontend:latest

      - name: Copy compose file to EC2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          port: 22
          source: "docker-compose.prod.yml"
          target: "/home/ubuntu/apps/[project-name]"

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          port: 22
          script: |
            set -e

            export ECR_REGISTRY="${{ env.ECR_REGISTRY }}"
            export IMAGE_TAG="${{ env.IMAGE_TAG }}"

            # ── Write backend .env.aws ──
            mkdir -p /home/ubuntu/apps/[project-name]/backend
            cat > /home/ubuntu/apps/[project-name]/backend/.env.aws << 'EOF'
            PORT=8000
            HOST=0.0.0.0
            NODE_ENV=production
            DATABASE_URL=${{ secrets.DATABASE_URL }}
            DATABASE_POOL_SIZE=${{ secrets.DATABASE_POOL_SIZE }}
            RXNORM_DB_URL=${{ secrets.RXNORM_DB_URL }}
            UMLS_DB_URL=${{ secrets.UMLS_DB_URL }}
            SNOMEDCT_DB_URL=${{ secrets.SNOMEDCT_DB_URL }}
            LOG_LEVEL=${{ secrets.LOG_LEVEL }}
            TZ=${{ secrets.TZ }}
            EOF

            # ── Write frontend .env.aws ──
            mkdir -p /home/ubuntu/apps/[project-name]/frontend
            cat > /home/ubuntu/apps/[project-name]/frontend/.env.aws << 'EOF'
            NEXT_PUBLIC_API_BASE_URL=${{ secrets.NEXT_PUBLIC_API_BASE_URL }}
            NODE_ENV=production
            EOF

            # ── Authenticate to ECR ──
            aws ecr get-login-password --region [AWS-REGION] | \
              docker login --username AWS --password-stdin $ECR_REGISTRY

            # ── Pull new images ──
            cd /home/ubuntu/apps/[project-name]
            docker-compose -f docker-compose.prod.yml pull

            # ── Restart containers ──
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d

            # migrations run on container startup via CMD

            # ── Cleanup old images ──
            docker image prune -f
```

---

## 8. DNS Configuration

### 8.1 ALB DNS Name

Get from: **EC2 Console → Load Balancers → [project-name]-alb → Description tab**

### 8.2 DNS Records

At your DNS provider:

```
[your-domain].com          CNAME    [alb-dns-name].[region].elb.amazonaws.com
```

### 8.3 ACM Certificate

```
AWS Console → Certificate Manager → Request certificate
  Domain name: *.your-domain.com
  Validation method: DNS validation
```

Add the CNAME record provided by ACM to your DNS.

---

## 9. First Deployment

### Pre-Flight Checklist

```
□ Security Groups created ([project-name]-alb-sg, ec2-sg, rds-sg)
□ RDS provisioned with databases
□ EC2 instance running
□ Docker installed on EC2
□ Docker Compose installed on EC2
□ ECR repositories created
□ ALB provisioned with HTTPS listener
□ ACM wildcard cert issued
□ Target Groups created
□ ALB Listener Rules configured
□ DNS records pointing to ALB
□ docker-compose.prod.yml on EC2
□ .env.aws files on EC2
□ GitHub Actions secrets configured
```

### Deploy

```bash
git push origin main
```

---

## 9.1 ECR Image Lifecycle Management

### Overview

Each deployment pushes a new image tagged with the Git commit SHA and `:latest`. Over time, old images accumulate in ECR and cost storage. It's recommended to set up a lifecycle policy to automatically clean up old images.

### Recommended Lifecycle Policy

Create a policy that keeps only the **last 3 images** and automatically expires older ones:

1. Go to **ECR → Repositories → [repository-name]**
2. Click **Lifecycle policies → Create lifecycle policy**
3. Use this JSON policy:

```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 3 images, expire the rest",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 3
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

4. Click **Create lifecycle policy**

### Manual Cleanup (Console)

To manually delete old images:

1. Go to **ECR → Repositories**
2. Click on `drug-reference-frontend` or `drug-reference-backend`
3. **Select images to delete** (check boxes next to old SHA-tagged or untagged images)
4. Click **Delete**

### Manual Cleanup (CLI)

List untagged images:

```bash
aws ecr list-images --repository-name drug-reference-frontend --region us-east-1 --filter "tagStatus=untagged"
```

Delete an image:

```bash
aws ecr delete-images --repository-name drug-reference-frontend --region us-east-1 --image-ids imageTag=old-sha-tag
```

### How Docker Tags Work

- When you push a new `:latest` tag, it **overwrites** the previous pointer
- The old image becomes **untagged** (no tag points to it)
- It still exists in ECR until cleaned up by your lifecycle policy or manual deletion

---

## 10. Adding New Projects

### 10.1 Create New ECR Repositories

```bash
aws ecr create-repository --repository-name [project-2-name]-frontend
aws ecr create-repository --repository-name [project-2-name]-backend
```

### 10.2 Update docker-compose.prod.yml

```yaml
services:
  frontend2:
    image: ${ECR_REGISTRY}/[project-2-name]-frontend:${IMAGE_TAG}
    ports:
      - "3001:3001"

  backend2:
    image: ${ECR_REGISTRY}/[project-2-name]-backend:${IMAGE_TAG}
    ports:
      - "8001:8001"
```

### 10.3 Create New Target Groups

- `[project-2-name]-frontend-tg` → port 3001
- `[project-2-name]-backend-tg` → port 8001

### 10.4 Add Listener Rules

```
[project-2-name].[your-domain].com          → [project-2-name]-frontend-tg
[project-2-name].[your-domain].com/api      → [project-2-name]-backend-tg
```

### 10.5 Update GitHub Actions

Add new build/push steps for [project-2-name] images.

---

## Appendix: Prisma Migrations

When running Prisma migrations in production, ensure the schema is found correctly:

- The Docker image has `prisma/schema.prisma` at `/app/prisma/schema.prisma`
- The working directory in the container is `/app` (per Dockerfile)
- Prisma automatically finds the schema relative to the working directory
- Migrations are run via `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]` in the Dockerfile

**Do NOT use `--schema` flag** - it's not needed and can cause path resolution issues.

```bash
# Migrations run automatically on container startup via Dockerfile CMD
# The CMD executes: npx prisma migrate deploy && node dist/server.js
```
