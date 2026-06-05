# GCP + GKE + GitHub Actions + Argo CD React App

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

---

## 2. Create the GKE cluster

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

---

## 8. Troubleshooting

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
