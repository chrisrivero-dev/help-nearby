#!/bin/bash

# Deploy script for helpnearby.co
# Usage: ./deploy.sh [ec2-host] [ec2-user]

EC2_HOST=${1:-"helpnearby.co"}
EC2_USER=${2:-"ubuntu"}
BRANCH=${3:-"deployment/aws-helpnearby-co"}

echo "Deploying to $EC2_HOST as $EC2_USER..."
echo "Using branch: $BRANCH"

# Check if on correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "Warning: Not on branch $BRANCH. Current branch: $CURRENT_BRANCH"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build frontend
echo "Building frontend..."
cd frontend
pnpm install
pnpm build
cd ..

# Create deploy archive (excluding node_modules to transfer separately)
echo "Creating deployment archive..."
tar -czf /tmp/helpnearby-deploy.tar.gz \
    frontend/.next \
    frontend/package.json \
    frontend/pnpm-lock.yaml \
    frontend/public \
    --exclude='frontend/.next/cache'

# Transfer to EC2
echo "Transferring to $EC2_HOST..."
scp /tmp/helpnearby-deploy.tar.gz $EC2_USER@$EC2_HOST:/tmp/

# Deploy on EC2
echo "Deploying on $EC2_HOST..."
ssh $EC2_USER@$EC2_HOST << EOF
    # Extract deployment
    cd /var/www/helpnearby.co
    tar -xzf /tmp/helpnearby-deploy.tar.gz
    rm /tmp/helpnearby-deploy.tar.gz

    # Install dependencies
    pnpm install --production

    # Restart app
    pm2 reload next-app || pm2 start /var/www/helpnearby.co/start.sh --name next-app
EOF

# Cleanup
rm -f /tmp/helpnearby-deploy.tar.gz

echo "Deployment complete!"