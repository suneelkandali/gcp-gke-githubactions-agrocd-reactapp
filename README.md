# gcp-gke-githubactions-agrocd-reactapp

## Build Docker image



docker build --no-cache -t gcp-gke-githubactions-agrocd-reactapp:v1.0.0 .

docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/gke-hello-world-498115/react-repo/gcp-gke-githubactions-agrocd-reactapp:v1.0.0 .

docker buildx build --platform linux/amd64 -t us-central1-docker.pkg.dev/gke-hello-world-498115/react-repo/gcp-gke-githubactions-agrocd-reactapp:v1.0.0 --push .

docker push us-central1-docker.pkg.dev/gke-hello-world-498115/react-repo/gcp-gke-githubactions-agrocd-reactapp:v1.0.0


gcloud container clusters create-auto gcp-gke-githubactions-agrocd-cluster \
    --region us-central1

## For generating kubeconfig entry

gcloud container clusters get-credentials gcp-gke-githubactions-agrocd-cluster \
    --region us-central1 \
    --project gke-hello-world-498115

kubectl config current-context

gcloud container clusters delete gcp-gke-githubactions-agrocd-cluster --region us-central1

Delete the cluster after the test is complete

gcloud container clusters delete gcp-gke-githubactions-agrocd-cluster --region us-central1


### Steps for build and deployment using GitHub Actions

Step 1: Create a Service Account in GCP
If you don't already have a Service Account with the right permissions, you can create one quickly:

Open the Google Cloud Console.

In the left navigation menu, go to IAM & Admin > Service Accounts.

Click the + CREATE SERVICE ACCOUNT button at the top.

Fill in the details:

Service account name: github-actions-gke-deployer

Click Create and Continue.

Under Grant this service account access to project, click the Select a role dropdown and add these permissions:

Artifact Registry Writer (Required to push the Docker image)

(Optional) Kubernetes Engine Developer (If you want GitHub Actions to deploy directly to GKE later instead of relying entirely on ArgoCD manual syncs).

Click Continue and then Done.

Step 2: Generate the JSON Key File
On the Service Accounts page, find the account you just created in the list.

Click the three vertical dots (Actions) under the Actions column on the far right of that row, and select Manage keys.

Click ADD KEY > Create new key.

Select JSON as the key type and click Create.

A .json file will automatically download to your computer.

Open this file with any text editor (like VS Code, TextEdit, or Notepad) and copy the entire text inside it. It will look like a giant block of bracketed configuration data.

Step 3: Save the Key into GitHub Secrets
Open your web browser, navigate to GitHub, and open your specific project repository.

Click on the Settings tab located in the top menu bar of your repository.

In the left-hand sidebar, scroll down to the Security section and click on Secrets and variables > Actions.

Click the green New repository secret button in the upper right.

Configure the secret fields exactly like this:

Name: GCP_SA_KEY (Must be exactly uppercase to match your workflow file)

Secret: Paste the entire block of JSON text you copied from your downloaded file in Step 2.

Click Add secret.

