# 🚀 Modern Cloud-Native DevOps Portfolio

[![Terraform](https://img.shields.io/badge/IaC-Terraform-623CE4?logo=terraform)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/Cloud-AWS-232F3E?logo=amazon-aws)](https://aws.amazon.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions)](https://github.com/features/actions)
[![Security](https://img.shields.io/badge/Security-Checkov-blue?logo=checkov)](https://www.checkov.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade, high-performance static portfolio website engineered with a **Security-First** and **Automation-Driven** mindset. This project serves as a live demonstration of modern DevOps practices, including **Infrastructure as Code (IaC)**, **Quality Gates**, and **Cloud-Native Deployment**.

---

## 🏗️ System Architecture

This project implements a professional **Source-to-Edge** workflow, separating source logic from build artifacts and infrastructure management.

```mermaid
graph LR
    subgraph Local_Dev ["💻 Local Development"]
        Code[Source Code] --> Husky[Husky Hooks]
        Husky --> Build[Node.js Build Engine]
    end

    subgraph GitHub_Actions ["⚙️ CI/CD Pipeline"]
        Push[Git Push] --> Lint[ESLint / TypeCheck]
        Lint --> Scan[Checkov IaC Scan]
        Scan --> Deploy[AWS Deployment]
    end

    subgraph AWS_Cloud ["☁️ AWS Infrastructure"]
        Deploy --> S3[S3 Bucket]
        S3 --> CF[CloudFront CDN]
        CF --> User[Global Users]
    end

    Code -.-> Push
```

---

## 🛠️ Tech Stack & Tooling

| Category | Tools |
| :--- | :--- |
| **Frontend** | HTML5, Tailwind CSS, Vanilla JS, Lucide Icons |
| **Automation** | Node.js (Custom Build Engine), Husky, Shell Scripts |
| **Infrastructure** | Terraform (HCL), AWS (S3, CloudFront, Route 53, ACM) |
| **Security** | Checkov (IaC Scan), TFLint, ESLint, Content Integrity Validation |
| **CI/CD** | GitHub Actions (Multi-stage Pipelines) |

---

## 📂 Project Structure

```text
.
├── .github/workflows/   # CI/CD Pipeline definitions (Lint, Security, Deploy)
├── config/              # Centralized Site Content & Configuration (JSON)
├── docs/                # Architecture diagrams & technical documentation
├── public/              # Root-level static files (robots.txt, sitemap.xml)
├── scripts/             # Professional Build & Automation scripts (Node.js)
├── src/                 # Source assets (Templates, Styles, Client-side JS)
├── terraform/           # Infrastructure as Code (Modules, Security Groups, CDN)
└── dist/                # [GIT IGNORED] Production-ready build output
```

---

## 🔒 Security & Quality Gates

This project enforces high engineering standards through automated gates:
- **Shift-Left Security**: Checkov scans Terraform code for misconfigurations before deployment.
- **Code Integrity**: Custom build engine validates that no `{{PLACEHOLDERS}}` are left unreplaced in production.
- **Pre-commit Hooks**: Husky ensures data is synced and linting passes before any commit is allowed.
- **IaC Linting**: TFLint ensures Terraform follows AWS best practices and tagging policies.
- **Automated Cache Busting**: Implements cryptographic content hashing for JS/CSS assets to enable long-term immutable caching without staleness.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+) & npm
- Terraform (v1.5+)
- AWS CLI configured with appropriate permissions

### 1. Installation
```bash
git clone https://github.com/shubhmate/cloud-native-portfolio.git
cd cloud-native-portfolio
npm install
```

### 2. Local Development
```bash
# Start dev server with hot-reload simulation
npm run dev
```

### 3. Build & Test
```bash
# Fetch latest GitHub data and generate production build
npm run fetch
npm run build
```

---

## ☁️ Infrastructure Deployment

### Phase 1: Local Simulation
Test the deployment logic locally using **LocalStack**:
```bash
npm run localstack:start
npm run deploy:localstack
```

### Phase 2: AWS Production
1. **Initialize Terraform**:
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```
2. **Configure CI/CD**: Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to GitHub Actions Secrets.
3. **Automated Updates**: Push any change to the `main` branch to trigger the automated build engine (Tailwind compilation + Asset Hashing) and global CloudFront invalidation.

---

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

**Crafted with ❤️ by [Shubham Mate](https://shubhammate.com)**
*"Automating the world, one commit at a time."*