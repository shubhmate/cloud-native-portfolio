# 🚀 DevOps Engineer Portfolio

A professional, high-performance static portfolio website built with a **Product-First** mindset. This project isn't just a webpage—it's a showcase of **CI/CD automation**, **Infrastructure as Code (IaC)**, and **Source-to-Build** architecture.

---

## 🏗 System Architecture

This project follows an industry-standard **Source/Dist** separation, ensuring that source code and build artifacts never mix.

```text
/static-portfolio
├── scripts/          # Build & Data-fetching scripts (Node.js)
├── config/           # Site content & configuration (JSON)
├── src/              # Source code (Templates, CSS, JS)
├── dist/             # Generated production-ready site (S3/CloudFront Target)
├── docs/             # Technical documentation & architecture
└── notes/            # Internal development notes
```

## 🛠 Features & Automation

- **Automated Data Sync**: Fetches real-time project data and descriptions from the GitHub API.
- **Atomic Builds**: A custom Node.js engine fills templates and generates a minified, production-ready `dist/` folder.
- **Quality Gates**: Husky pre-commit hooks ensure that data is synced and the site builds successfully before any code is saved.
- **Dev Server**: Integrated local development environment with instant previews.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/shubhmate/static-portfolio.git
cd static-portfolio
npm install
```

### Development Workflow
To start the local development server and preview changes:
```bash
npm run dev
```

### Sync GitHub Projects
To update your portfolio with your latest GitHub repositories:
```bash
npm run fetch
```

### Production Build
To generate the final website for deployment:
```bash
npm run build
```

## ☁️ Deployment
This project is designed to be deployed to **AWS (S3 + CloudFront)** via a GitHub Actions pipeline. Only the contents of the `dist/` folder are synced to the edge, ensuring a clean and secure production environment.

---

**Crafted by [Shubham Mate](https://shubhammate.com)**