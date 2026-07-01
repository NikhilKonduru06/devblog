#!/bin/bash
set -e

echo "============================================"
echo "  DevBlog — Teardown"
echo "============================================"

echo "[1/3] Removing Ingress (so ALB gets deleted by controller)..."
kubectl delete -f k8s/frontend.yaml --ignore-not-found || true
sleep 90

echo "[2/3] Confirming ALB deleted..."
aws elbv2 describe-load-balancers --region us-east-1 \
  --query "LoadBalancers[*].LoadBalancerName" --output table

echo "[3/3] Destroying AWS infrastructure with Terraform..."
cd terraform
terraform destroy -auto-approve
cd ..

echo ""
echo "Teardown complete. No AWS resources running."
