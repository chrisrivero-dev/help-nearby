# AWS EC2 Setup for helpnearby.co (Docker)

## Prerequisites

- AWS account with access to EC2, ALB, ACM, ECR, and Route 53
- Domain: helpnearby.co registered at Namecheap

## Setup Steps

### 1. Create IAM User (for GitHub Actions)

Create an IAM user with the following permissions:

- `AmazonEC2FullAccess`
- `AmazonEC2ContainerRegistryFullAccess`
- `AWSCertificateManagerFullAccess`
- `Route53FullAccess`

Store the credentials as GitHub Secrets:

- `EC2_SSH_PRIVATE_KEY` - Your private SSH key
- `EC2_HOST` - EC2 public IP or DNS
- `EC2_USER` - Usually `ubuntu` (for Ubuntu AMI)
- `AWS_ACCESS_KEY_ID` - IAM user access key
- `AWS_SECRET_ACCESS_KEY` - IAM user secret key
- `AWS_ACCOUNT_ID` - Your 12-digit AWS account ID

### 2. Create ECR Repository

In AWS Console (ECR):

- Create repository named `helpnearby`
- Set access type to "AWS IAM"

### 3. Create EC2 Instance

**AMI:** Ubuntu 22.04 LTS
**Instance Type:** t3.micro (free tier eligible)
**Security Group:** Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Docker)
**Key Pair:** Create or select existing SSH key

### 4. Install Docker on EC2

SSH into EC2 and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo usermod -aG docker $USER

# Enable Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
```

### 5. Configure ALB (Recommended)

- Create ALB in same VPC as EC2
- Add EC2 instance to target group
- Configure HTTPS listener with ACM certificate for helpnearby.co
- Forward traffic to port 3000

### 6. DNS Setup (Namecheap)

Create A records:
| Host | Value | Type |
|------|-------|------|
| `@` | EC2_PUBLIC_IP | A |
| `www` | EC2_PUBLIC_IP | A |

### 7. Test Deployment Locally

Build and run Docker locally to verify:

```bash
docker build -t helpnearby:latest .
docker run -p 3000:3000 helpnearby:latest
```

### 8. GitHub Secrets Setup

Go to Repository Settings → Secrets and Variables → Actions

Add:

- `AWS_ACCESS_KEY_ID` - IAM user access key
- `AWS_SECRET_ACCESS_KEY` - IAM user secret key
- `AWS_ACCOUNT_ID` - Your 12-digit AWS account ID
- `EC2_SSH_PRIVATE_KEY` - SSH private key for EC2 access
- `EC2_HOST` - EC2 public IP or DNS
- `EC2_USER` - SSH username (e.g., `ubuntu`)

### 9. Deploy via GitHub Actions

Push to `deployment/aws-helpnearby-co` branch to trigger automatic deployment.
