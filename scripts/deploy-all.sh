#!/bin/bash
set -e

echo "============================================"
echo "  DevBlog — Full Automated Deployment"
echo "============================================"
START_TIME=$(date +%s)

# ── Step 1: Terraform ─────────────────────────────────────────────────────────
echo ""
echo "[1/6] Provisioning AWS infrastructure with Terraform..."
cd terraform
terraform init -input=false
terraform apply -auto-approve
CLUSTER_NAME=$(terraform output -raw cluster_name)
AWS_REGION=$(terraform output -raw region)
cd ..
echo "    EKS cluster ready: $CLUSTER_NAME"

# ── Step 2: Connect kubectl ───────────────────────────────────────────────────
echo ""
echo "[2/6] Configuring kubectl..."
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"
kubectl cluster-info
echo "    kubectl connected"

# ── Step 3: Install AWS Load Balancer Controller ──────────────────────────────
echo ""
echo "[3/6] Installing AWS Load Balancer Controller..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

eksctl utils associate-iam-oidc-provider \
  --cluster "$CLUSTER_NAME" --region "$AWS_REGION" --approve

curl -sO https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json 2>/dev/null || echo "Policy already exists"

eksctl create iamserviceaccount \
  --cluster="$CLUSTER_NAME" \
  --region="$AWS_REGION" \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn="arn:aws:iam::${ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy" \
  --override-existing-serviceaccounts \
  --approve

VPC_ID=$(aws eks describe-cluster \
  --name "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --query "cluster.resourcesVpcConfig.vpcId" --output text)

helm repo add eks https://aws.github.io/eks-charts && helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName="$CLUSTER_NAME" \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region="$AWS_REGION" \
  --set vpcId="$VPC_ID"

echo "    Load Balancer Controller installed"

# ── Step 4: Install ArgoCD ────────────────────────────────────────────────────
echo ""
echo "[4/6] Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
echo "    ArgoCD ready"

# ── Step 5: Apply K8s Secrets ─────────────────────────────────────────────────
echo ""
echo "[5/6] Applying Kubernetes secrets and ArgoCD application..."
echo ""
echo "    IMPORTANT: Update k8s/secrets.yaml with your GEMINI_API_KEY before continuing"
echo "    Press ENTER when ready..."
read -r

kubectl apply -f k8s/secrets.yaml
kubectl apply -f argocd/application.yaml
echo "    ArgoCD application registered — GitOps sync starting..."

# ── Step 6: Done ──────────────────────────────────────────────────────────────
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "  Total time: ${ELAPSED}s"
echo "============================================"
echo ""
echo "  ArgoCD UI:"
echo "    kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "    Password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
echo ""
echo "  App URL:"
echo "    kubectl get ingress -n devblog"
echo ""
echo "  Grafana:"
echo "    kubectl port-forward svc/grafana-service -n devblog 3001:3000"
echo "    Login: admin / devblog123"
echo ""
