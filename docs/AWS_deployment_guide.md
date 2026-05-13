# AWS Deployment Guide for helpnearby.co

## Overview

This guide covers end-to-end deployment of a Dockerized Next.js frontend (port 5000) and FastAPI backend (port 9000) to AWS using GitHub Actions for manual CI/CD.

## Architecture

```
User → helpnearby.co (DNS) → ALB (HTTPS:443/HTTP:80) → EC2
                                                     ↓
                                        ┌──────────┬──────────┐
                                        │          │          │
                                  ┌─────▼─────┐ ┌───▼────────┐
                                  │  Port 5000│ │ Port 9000  │
                                  │  Frontend │ │  Backend   │
                                  │   (Next.js)│ │ (FastAPI)  │
                                  └───────────┘ └────────────┘
                                        ↓          ↓
                              helpnearby-frontend helpnearby-backend
                                  ECR repo       ECR repo
```

## Prerequisites

- AWS account with access to EC2, ALB, ACM, ECR, IAM, S3
- Domain: helpnearby.co registered at Namecheap (NOT Route53)
- GitHub repository: chrisrivero-dev/help-nearby
- Branch: `deployment/aws-helpnearby-co`

---

## Phase 1: IAM & OIDC Setup (One-time)

### Step 1: Create OIDC Identity Provider

This enables GitHub Actions to authenticate with AWS without access keys.

1. Go to IAM → **Identity providers** → **Create provider**
2. Provider Type: `OpenID Connect`
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click **Create**

### Step 2: Create IAM Role `helpnearbyGitHubDeployer`

1. Go to IAM → **Roles** → **Create role**
2. Trust entity: **Web identity**
3. Web identity provider: Select your OIDC provider
4. Audience: `sts.amazonaws.com`
5. Next → **Permissions**:
   - `AmazonEC2FullAccess`
   - `AmazonECRFullAccess`
   - `AWSCertificateManagerFullAccess`
   - `AmazonS3FullAccess`
6. Next → Name: `helpnearbyGitHubDeployer`
7. In **Trust relationships**, edit and paste the full policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:sub": "repo:chrisrivero-dev/help-nearby:environment:production",
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           }
         }
       }
     ]
   }
   ```
   > **Important**: The `sub` value uses `environment:production` (not `ref:refs/heads/...`) because the workflow sets `environment: production`. When a GitHub Actions job has an `environment:` field, GitHub replaces the branch ref in the `sub` claim with the environment name. Using the branch ref in this case will always fail with "Not authorized to perform sts:AssumeRoleWithWebIdentity".

### Step 3: Create Security Groups

**EC2 Security Group (`helpnearby-ec2-sg`):**

- SSH: 22 (your IP/32)
- Port 5000: from `helpnearby-alb-sg`
- Port 9000: from `helpnearby-alb-sg`

**ALB Security Group (`helpnearby-alb-sg`):**

- HTTP: 80 (0.0.0.0/0)
- HTTPS: 443 (0.0.0.0/0)

### Step 4: Create ECR Repositories

1. Go to ECR → **Repositories** → **Create repository**
2. Create `helpnearby/frontend` (Private)
3. Create `helpnearby/backend` (Private)

---

## Phase 2: AWS Infrastructure

### Step 5: Request ACM Certificate

**Important**: ACM certificates are FREE and issued via DNS validation.

1. Go to ACM → **Certificates** → **Request certificate**
2. Domain name: `*.helpnearby.co` (wildcard)
3. Validation: **DNS validation**
4. Click **Request**

### Step 6: Add DNS Validation Records at Namecheap

After requesting, ACM provides CNAME records. Add them to Namecheap:

1. Go to ACM certificate details → **Domains** section
2. Find the CNAME record:
   - **Record Name**: `_xxxxxx.helpnearby.co`
   - **Record Value**: `_xxxxxx.acm-validations.aws.`
   - **Record Type**: CNAME

3. At Namecheap DNS settings (Advanced DNS tab):
   - **Host/Name**: `_xxxxxx` (just the underscore-prefixed token, **NOT** including `.helpnearby.co`)
   - **Value**: `_xxxxxx.acm-validations.aws.`
   - **Type**: CNAME

**Important**: Namecheap will automatically append `.helpnearby.co` to create the full record name.

4. Wait ~5-10 minutes, then click **Refresh** in ACM
5. Certificate status should change to **Issued**

### Step 7: Create Target Groups

**Frontend Target Group:**

1. Go to EC2 → **Target Groups** → **Create target group**
2. Name: `helpnearby-frontend-tg`
3. Protocol: HTTP, Port: **5000**
4. Health check path: `/`
5. Register `helpnearby-ec2` instance

**Backend Target Group:**

1. Go to EC2 → **Target Groups** → **Create target group**
2. Name: `helpnearby-backend-tg`
3. Protocol: HTTP, Port: **9000**
4. Health check path: `/health`
5. Register `helpnearby-ec2` instance

### Step 8: Create ALB

1. Go to EC2 → **Load Balancers** → **Create load balancer**
2. Type: **Application Load Balancer**
3. Name: `helpnearby-alb`
4. Network mapping:
   - VPC: Same as EC2
   - Subnets: At least 2 public subnets in different AZs
   - Security group: `helpnearby-alb-sg`
5. Configure routing:
   - Listener: HTTPS (443)
   - Default target group: `helpnearby-frontend-tg`
   - SSL certificate: Select your ACM certificate
6. Click **Create load balancer**

### Step 9: Configure ALB Routing Rules

1. Go to ALB → **Listeners** tab
2. Click **View/edit rules** under HTTPS (443)
3. **Add rule** (move to top):
   - **If**: Path is `/api/*`
   - **Then**: Forward to `helpnearby-backend-tg`
4. Default rule: Forward to `helpnearby-frontend-tg`

### Step 10: Add HTTP to HTTPS Redirect

1. Go to ALB → **Listeners** → **Add listener**
2. Protocol: HTTP, Port: 80
3. Default action: Redirect to HTTPS (port 443, status 301)

---

## Phase 3: EC2 & Docker Setup

### Step 11: Launch EC2 Instance

1. Go to EC2 → **Instances** → **Launch instances**
2. Name: `helpnearby-ec2`
3. AMI: Ubuntu Server 26.04 LTS (HVM)
4. Instance type: `t3.micro` (free tier eligible)
5. Key pair: Create or select existing SSH key
6. Network settings:
   - VPC: Same as ALB
   - Security group: `helpnearby-ec2-sg`
7. Storage: 20 GiB gp3
8. User data (cloud-init to install Docker):
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

### Step 12: Verify Docker on EC2

SSH into EC2 and verify:

```bash
docker --version
docker ps
```

---

## Phase 4: DNS Configuration

### Step 13: Add A Records at Namecheap

At Namecheap DNS settings (Advanced DNS tab):

| Host  | Value        | Type        |
| ----- | ------------ | ----------- |
| `@`   | ALB_DNS_NAME | ALIAS/ANAME |
| `www` | ALB_DNS_NAME | ALIAS/ANAME |

**Note**: For A records at Namecheap, enter just `@` or `www` in the Host field (no domain suffix needed - Namecheap appends it automatically).

---

## Phase 5: GitHub Configuration

### Step 14: Add GitHub Secrets

Go to Repository → **Settings** → **Secrets and Variables** → **Actions**

Add:

- `AWS_ACCOUNT_ID` - 12-digit AWS account ID
- `EC2_SSH_PRIVATE_KEY` - SSH private key for EC2 (NOT the public key)
- `EC2_HOST` - EC2 public IP or ALB DNS name
- `EC2_USER` - SSH username (e.g., `ubuntu`)

> **Important**: The SSH private key added to GitHub secrets must correspond to the public key that's already in EC2's `~/.ssh/authorized_keys` file. If they don't match, the deployment will fail with "Permission denied (publickey)". To extract the public key from a `.pem` file: `ssh-keygen -y -f your-key.pem`

---

## Phase 5a: EC2 SSH Key Setup (One-time)

### Step 15a: Add Public Key to EC2

If you haven't already, add your SSH public key to the EC2 instance:

1. Generate a new key pair (or extract public key from existing `.pem`):

   ```bash
   # Generate new key
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/helpnearby-ec2

   # Extract public key for adding to EC2
   cat ~/.ssh/helpnearby-ec2.pub
   ```

2. Add the public key to EC2's `authorized_keys`:

   ```bash
   # SSH into EC2 and run:
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo "your-public-key-here" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. Add the **private key** to GitHub secrets:
   ```bash
   cat ~/.ssh/helpnearby-ec2
   ```

---

## Phase 6: Testing & Deployment

### Step 15: Test Locally

**Frontend:**

```bash
cd frontend
pnpm install
pnpm build
pnpm start
```

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 9000
```

### Step 16: Deploy via GitHub Actions

1. Go to GitHub → **Actions**
2. Select **Deploy to EC2 via Docker** workflow
3. Click **Run workflow** → **Run workflow**
4. Monitor logs for any errors

---

## Common Issues

### Docker Pull Fails on EC2

- Ensure Docker is running: `sudo systemctl status docker`
- Check IAM role permissions for ECR

### GitHub Actions Fails with "Cannot assume role" / "Not authorized to perform sts:AssumeRoleWithWebIdentity"

- Ensure `AWS_ACCOUNT_ID` secret is set correctly
- Verify the OIDC provider `token.actions.githubusercontent.com` exists under IAM → Identity Providers
- Check the trust policy `sub` condition carefully:
  - If the workflow job has `environment: production`, the `sub` must be `repo:ORG/REPO:environment:production`
  - If there is **no** `environment:` field, the `sub` must be `repo:ORG/REPO:ref:refs/heads/BRANCH`
  - These are mutually exclusive — using the branch ref when an environment is set will always fail

### ACM Certificate Stuck in "Pending validation"

- Verify CNAME records are correctly added at Namecheap
- Wait 5-10 minutes for DNS propagation
- Click "Refresh" in ACM

### ALB Health Check Fails

- Verify both containers are running: `docker ps`
- Check target group health status in AWS Console
- Ensure containers are listening on correct ports (5000/9000)

---

## Cost Summary

| Service         | Cost (Free Tier)          |
| --------------- | ------------------------- |
| ACM Certificate | FREE                      |
| EC2 t3.micro    | FREE (750 hrs/month)      |
| ALB             | ~$16/month                |
| ECR             | Free (first 500 MB/month) |
| S3              | Free tier limits          |
