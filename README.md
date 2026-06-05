# React App deployment to Google Cloud - Kubernetes Environment with CI using GitHub Actions and CD using ArgoCD

This repository demonstrates how to build a React app, publish a Docker image to Google Artifact Registry, and deploy it to GKE through Argo CD using GitHub Actions.

## What you will do

1. Create a Google Kubernetes Engine (GKE) cluster.
2. Install Argo CD.
3. Create and store GitHub secrets.
4. Configure the Argo CD application.
5. Run the deployment from GitHub Actions.
6. Clean up resources when finished.

---

## 1. Prerequisites

You need the following installed on your computer:
- `gcloud`
- `kubectl`
- `docker`
- access to your Google Cloud project
- a GitHub repository for this project

If you do not already have the required tools installed, follow these steps.

### Install Google Cloud SDK

1. Download and install the SDK for your platform from:
   https://cloud.google.com/sdk/docs/install
2. Initialize the SDK:

```bash
gcloud init
```

3. Log in to your Google account:

```bash
gcloud auth login
```

4. Set the active project:

```bash
gcloud config set project gke-hello-world-498115
```

### Install kubectl

Follow the instructions at:
https://kubernetes.io/docs/tasks/tools/

For macOS with Homebrew:

```bash
brew install kubectl
```

Verify installation:

```bash
kubectl version --client
```

### Install Docker

Download Docker Desktop for your platform from:
https://www.docker.com/get-started

After installation, verify Docker is running:

```bash
docker version
```

### Confirm the SDK is working

```bash
gcloud auth list

gcloud config list
```

---

## 2. Create your React application and push to GitHub

If you do not already have a React app in this repository, create one with Vite:

```bash
npm create vite@latest . -- --template react
npm install
```

If the repository is not yet a Git repo, initialize it:

```bash
git init
git add .
git commit -m "Initial React app"
```

Add your GitHub repository as the remote and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

If your repository already exists locally, simply commit and push your changes:

```bash
git add .
git commit -m "Add React app"
git push origin main
```

---

## 3. Create the GKE cluster

Run these commands in your terminal:

```bash
gcloud container clusters create gcp-gke-githubactions-argocd-cluster \
  --zone us-central1-a \
  --num-nodes=1 \
  --machine-type=e2-medium \
  --disk-size=30 \
  --disk-type=pd-ssd
```

Then connect `kubectl` to the cluster:

```bash
gcloud container clusters get-credentials gcp-gke-githubactions-argocd-cluster \
  --zone us-central1-a \
  --project gke-hello-world-498115

kubectl config current-context
```

![GKE cluster created and kubectl configured](screenshots/gke-cluster-setup.png)
*Screenshot: GKE cluster creation and kubectl context setup.*

---

## 3. Install Argo CD

Install Argo CD into the `argocd` namespace:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for Argo CD pods to start:

```bash
kubectl get pods -n argocd
```

Expose the Argo CD server with a LoadBalancer so it is reachable from GitHub Actions:

```bash
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
```

Get the external IP for Argo CD:

```bash
kubectl get svc -n argocd argocd-server
```

Get the default admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

![Argo CD external IP and login information](screenshots/argocd-setup.png)
*Screenshot: Argo CD LoadBalancer external IP and initial admin login.*

Open the Argo CD UI using the external IP and log in with:
- Username: `admin`
- Password: the value from the previous command

---

## 4. Create GitHub Secrets

Store sensitive values in GitHub instead of hardcoding them in the workflow.

In GitHub, go to your repository `Settings` > `Secrets and variables` > `Actions`.

Create these repository secrets:

- `GCP_SA_KEY` &mdash; paste the JSON content of your GCP service account key.
- `ARGOCD_PASSWORD` &mdash; paste the Argo CD admin password.

![GitHub Secrets configuration](screenshots/github-secrets.png)
*Screenshot: GitHub Actions secrets dashboard with `GCP_SA_KEY` and `ARGOCD_PASSWORD` set.*

---

## 5. Configure the Argo CD application

Open `agrocd-app.yaml` and make sure the `path` matches where your Kubernetes manifest lives.

If `deployment.yaml` is in the repository root, use:

```yaml
spec:
  source:
    path: .
```

If you move `deployment.yaml` into a folder named `k8s`, use:

```yaml
spec:
  source:
    path: k8s
```

Apply or update the Argo CD Application:

```bash
kubectl apply -f agrocd-app.yaml
```

---

## 6. How GitHub Actions works

The workflow in `.github/workflows/ci.yaml` will:

1. check out your repository
2. authenticate to Google Cloud using `GCP_SA_KEY`
3. build and push a Docker image to Artifact Registry
4. update the deployment manifest with the new image tag
5. commit the updated manifest back to GitHub
6. log in to Argo CD
7. sync the application
8. wait for the application to become healthy

---

## 7. Run the deployment

Push your changes to the `main` branch:

```bash
git add .
git commit -m "Prepare deployment"
git push origin main
```

Then go to GitHub Actions and watch the workflow run.

![GitHub Actions workflow run](screenshots/github-actions-workflow.png)
*Screenshot: GitHub Actions workflow run showing the build and deploy steps.*

---

## 8. Validate the deployment

After the workflow completes, confirm the application is deployed and healthy.

### 8.1 Check Argo CD application status

Open the Argo CD UI and verify the app status is `Healthy` and `Synced`.

Or run:

```bash
argocd app get reactapp-gcp-gke-githubactions-cicd
```

Look for:
- `Sync Status: Synced`
- `Health Status: Healthy`

### 8.2 Check the Kubernetes deployment

Verify that the deployment is running in the target namespace:

```bash
kubectl get pods -n default
kubectl get svc -n default
```

### 8.3 Test the app URL in your browser

If your app is exposed via a Kubernetes service with an external IP or ingress, open that URL in your browser.

For example, if your service is exposed on port 80 and the external IP is `34.30.15.58`, open:

```text
http://34.30.15.58
```

If the app is not exposed externally, use port-forwarding to test it locally:

```bash
kubectl port-forward svc/<service-name> 8080:80 -n default
```

Then open:

```text
http://localhost:8080
```

---

## 9. Troubleshooting

### App path is wrong

If Argo CD shows an error like `app path does not exist`, set `path` in `agrocd-app.yaml` to the correct location.

### `Object 'Kind' is missing`

This means Argo CD tried to parse a file such as `package.json` as a Kubernetes manifest. Only include manifest files in the Argo CD app path.

### Permission denied on login

Verify that `ARGOCD_PASSWORD` in GitHub Secrets matches the current Argo CD admin password.

---

## 9. Clean up resources

When you are done, delete the GKE cluster:

```bash
gcloud container clusters delete gcp-gke-githubactions-argocd-cluster --zone us-central1-a
```

Remove any unnecessary service accounts or secrets from GitHub.
