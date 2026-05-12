# AWS Deployment Guide for helpnearby.co

## Overview

This guide covers end-to-end deployment of a Dockerized Next.js application to AWS using GitHub Actions for automated CI/CD.

## Architecture

```
User → helpnearby.co (DNS) → ALB (HTTPS) → EC2 (Docker container)
                                  ↓
                            ACM Certificate
                                  ↓
                            ECR (Docker registry)
                                  ↓
                            GitHub Actions (CI/CD)
```

## Prerequisites

- AWS account with access to EC2, ALB, ACM, ECR, IAM, Route 53
- Domain: helpnearby.co registered at Namecheap
- GitHub repository: chrisrivero-dev/help-nearby
- Branch: `deployment/aws-helpnearby-co`

---

## Phase 1: AWS Infrastructure Setup

### Step 1: Create OIDC Identity Provider (One-time AWS setup)

This enables GitHub Actions to authenticate with AWS without access keys.

1. Go to IAM → **Identity providers** → **Create provider**
2. Provider Type: `OpenID Connect`
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click **Create**

### Step 2: Create IAM Role `helpnearbyGitHubDeployer`

This role allows GitHub Actions to deploy to AWS.

1. Go to IAM → **Roles** → **Create role**
2. Trust entity: **Web identity**
3. Web identity provider: Select your OIDC provider
4. Audience: `sts.amazonaws.com`
5. Next → **Permissions**:
   - `AmazonEC2FullAccess`
   - `AmazonECRFullAccess`
   - `AWSCertificateManagerFullAccess`
   - `Route53ReadOnlyAccess`
6. Next → Name: `helpnearbyGitHubDeployer`
7. In **Trust relationships**, edit and add condition:
   ```json
   {
     "Condition": {
       "StringEquals": {
         "token.actions.githubusercontent.com:sub": "repo:chrisrivero-dev/help-nearby:ref:refs/heads/deployment/aws-helpnearby-co"
       }
     }
   }
   ```

### Step 3: Create ECR Repository

1. Go to ECR → **Repositories** → **Create repository**
2. Name: `helpnearby`
3. Visibility: `Private`
4. Click **Create repository**

### Step 4: Create EC2 Instance `helpnearby-ec2`

1. Go to EC2 → **Instances** → **Launch instances**
2. **Name**: `helpnearby-ec2`
3. **AMI**: Ubuntu 22.04 LTS
4. **Instance type**: `t3.micro` (free tier eligible)
5. **Key pair**: Create or select existing SSH key
6. **Network settings**:
   - VPC: Default or your existing VPC
   - Security group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Docker)
7. **User data** (cloud-init to auto-install Docker):
   ```yaml
   #cloud-config
   package_update: true
   package_upgrade: true
   packages:
     - docker.io
   runcmd:
     - sudo usermod -aG docker ubuntu
     - sudo systemctl enable docker
     - sudo systemctl start docker
   ```
8. Click **Launch instance**

### Step 5: Configure ALB (Application Load Balancer)

1. Go to EC2 → **Load Balancers** → **Create load balancer**
2. Type: **Application Load Balancer**
3. **Name**: `helpnearby-alb`
4. **Network mapping**:
   - VPC: Same as EC2
   - Subnets: At least 2 public subnets in different AZs
5. **Security groups**: Allow ports 80 (HTTP), 443 (HTTPS)
6. **Configure routing**:
   - Target group: New → `helpnearby-tg`
   - Protocol: HTTP, Port: 3000
   - Health checks: `/` (path), 30s interval
7. **Register targets**: Add your EC2 instance

### Step 6: Request SSL Certificate (ACM)

1. Go to ACM → **Certificates** → **Request certificate**
2. Domain name: `helpnearby.co`
3. Add SAN: `www.helpnearby.co`
4. Validation: **DNS validation** (recommended)
5. Click **Request**
6. Follow instructions to add CNAME records at Namecheap

### Step 7: Configure HTTPS Listener (ALB)

1. Go to Load Balancers → Select `helpnearby-alb`
2. **Listeners** tab → **Add listener**
3. Protocol: HTTPS, Port: 443
4. Default action: Forward to `helpnearby-tg`
5. SSL certificate: Select your ACM certificate

---

## Phase 2: DNS Configuration

### Step 8: DNS Setup at Namecheap

Create the following A records at Namecheap:

| Host  | Value                                 | Type        |
| ----- | ------------------------------------- | ----------- |
| `@`   | ALB_DNS_NAME (without .amazonaws.com) | ALIAS/ANAME |
| `www` | ALB_DNS_NAME (without .amazonaws.com) | ALIAS/ANAME |

Or use standard A records pointing to EC2 directly (if not using ALB):

| Host  | Value         | Type |
| ----- | ------------- | ---- |
| `@`   | EC2_PUBLIC_IP | A    |
| `www` | EC2_PUBLIC_IP | A    |

---

## Phase 3: GitHub Configuration

### Step 9: Add GitHub Secrets

Go to Repository → **Settings** → **Secrets and Variables** → **Actions**

Add the following secrets:

| Secret Name           | Description                    |
| --------------------- | ------------------------------ |
| `AWS_ACCOUNT_ID`      | Your 12-digit AWS account ID   |
| `EC2_SSH_PRIVATE_KEY` | SSH private key for EC2 access |
| `EC2_HOST`            | EC2 public IP or ALB DNS name  |
| `EC2_USER`            | SSH username (e.g., `ubuntu`)  |

### Step 10: Verify Workflow File

The `.github/workflows/deploy.yml` should contain:

```yaml
name: Deploy to EC2 via Docker

on:
  push:
    branches:
      - deployment/aws-helpnearby-co
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: helpnearby

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/helpnearbyGitHubDeployer
          role-session-name: GitHub-Deploy-${{ github.run_id }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        run: |
          docker build -t ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_REPOSITORY }}:${{ github.sha }} .
          docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_REPOSITORY }}:${{ github.sha }}

      - name: Setup SSH keys
        uses: webfactory/ssh-agent@v0.7.0
        with:
          ssh-private-key: ${{ secrets.EC2_SSH_PRIVATE_KEY }}

      - name: Deploy to EC2
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USER: ${{ secrets.EC2_USER }}
        run: |
          mkdir -p ~/.ssh
          chmod 700 ~/.ssh
          ssh-keyscan -H $EC2_HOST >> ~/.ssh/known_hosts
          chmod 644 ~/.ssh/known_hosts
          ssh $EC2_USER@$EC2_HOST "docker pull ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_REPOSITORY }}:${{ github.sha }} && docker stop next-app 2>/dev/null || true && docker rm next-app 2>/dev/null || true && docker run -d --name next-app -p 3000:3000 ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_REPOSITORY }}:${{ github.sha }}"
```

---

## Phase 4: Testing

### Step 11: Test Deployment Locally

Before deploying to AWS, test locally:

```bash
cd frontend
pnpm install
pnpm build
cd ..

docker build -t helpnearby:latest .
docker run -p 3000:3000 helpnearby:latest
```

Visit `http://localhost:3000` to verify.

---

## Phase 5: Deployment

### Step 12: Deploy via GitHub Actions

1. Commit and push to `deployment/aws-helpnearby-co`:

   ```bash
   git push origin deployment/aws-helpnearby-co
   ```

2. Go to GitHub → **Actions** to see the workflow run

3. Monitor logs for any errors

---

## Common Issues

### Docker Pull Fails on EC2

- Ensure Docker is running: `sudo systemctl status docker`
- Check IAM role permissions for ECR

### GitHub Actions Fails with "Cannot assume role"

- Verify OIDC trust relationship condition matches your repo/branch
- Ensure `AWS_ACCOUNT_ID` secret is set correctly

### Health Checks Fail

- Verify security groups allow traffic on port 3000
- Check EC2 instance is running: `docker ps`

---

## Cost Estimation (Free Tier Eligible)

| Service              | Cost (est.)          |
| -------------------- | -------------------- |
| EC2 t3.micro         | Free (750 hrs/month) |
| ALB                  | ~$16/month           |
| ECR                  | Free (first 500 MB)  |
| ACM                  | Free                 |
| Route 53 Hosted Zone | $0.50/month          |
